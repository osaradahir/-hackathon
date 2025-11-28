import base64
import io
import json
from datetime import datetime
from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()

try:
    from openai import OpenAI as OpenAIClient
except ImportError:
    OpenAIClient = None


class GroqService:
    def __init__(self):
        self.groq_key = os.getenv("GROQ_API_KEY")
        if not self.groq_key:
            raise Exception("GROQ_API_KEY no está configurada en el archivo .env")

        self.client = Groq(api_key=self.groq_key)

    # =============================================================
    # SPEECH → TEXT (Whisper Large v3 Turbo)
    # =============================================================
    async def speech_to_text(self, audio_data: bytes) -> str:
        try:
            if not audio_data or len(audio_data) == 0:
                raise Exception("El archivo de audio está vacío")

            if len(audio_data) < 50:
                raise Exception("El archivo de audio es demasiado corto")

            transcription = self.client.audio.transcriptions.create(
                file=("audio.webm", audio_data),
                model="whisper-large-v3",
                temperature=0,
                response_format="verbose_json"
            )

            return transcription.text

        except Exception as e:
            raise Exception(f"Error en speech to text: {str(e)}")

    # =============================================================
    # TEXT → TEXT (GPT OSS 120B)
    # =============================================================
    async def text_to_text(self, user_message: str, business_logic: str, conversation_context_json: str = None) -> tuple[str, str, bool]:
        """
        Genera respuesta usando GPT OSS 120B con contexto JSON
        
        Retorna:
        - respuesta_texto: str - La respuesta del modelo
        - contexto_json_actualizado: str - JSON con el contexto actualizado de la conversación
        - should_end_call: bool - True si el usuario quiere terminar la conversación
        """
        try:
            if not self.client:
                raise Exception("Cliente de Groq no inicializado")

            # Cargar contexto JSON existente o crear uno nuevo
            previous_messages = []
            if conversation_context_json:
                try:
                    context = json.loads(conversation_context_json)
                    all_loaded_messages = context.get("messages", [])
                    # Obtener solo los mensajes de usuario y asistente (excluir system)
                    previous_messages = [msg for msg in all_loaded_messages if msg.get("role") in ["user", "assistant"]]
                except (json.JSONDecodeError, TypeError, AttributeError):
                    previous_messages = []
            
            # Construir la lista de mensajes: system message primero, luego mensajes previos, luego mensaje actual
            messages = []
            
            # Siempre agregar el system message primero
            messages.append({
                "role": "system",
                "content": f"""Eres un asistente de voz profesional y amigable para una empresa.

Lógica del negocio y cómo debes actuar:
{business_logic}

Responde de manera natural, concisa y útil. Tu respuesta debe ser apropiada para ser convertida a voz. Mantén el contexto de la conversación anterior."""
            })
            
            # Agregar mensajes previos de la conversación
            messages.extend(previous_messages)
            
            # Agregar el mensaje actual del usuario
            messages.append({
                "role": "user",
                "content": user_message
            })

            # Detectar si el usuario quiere terminar la conversación
            should_end_call = self._check_if_user_wants_to_end(user_message)

            # Usar GPT OSS 120B
            completion = self.client.chat.completions.create(
                model="openai/gpt-oss-120b",
                messages=messages,
                temperature=1,
                max_completion_tokens=8192,
                top_p=1,
                reasoning_effort="medium",
                stream=False
            )

            response_text = completion.choices[0].message.content
            
            # Agregar la respuesta del asistente al contexto
            messages.append({
                "role": "assistant",
                "content": response_text
            })
            
            # Actualizar el contexto JSON
            updated_context = {
                "messages": messages,
                "last_updated": datetime.now().isoformat()
            }
            context_json = json.dumps(updated_context, ensure_ascii=False)

            return response_text, context_json, should_end_call

        except Exception as e:
            raise Exception(f"Error en text to text: {str(e)}")
    
    def _check_if_user_wants_to_end(self, user_message: str) -> bool:
        """
        Detecta si el usuario quiere terminar la conversación
        Busca frases como "eso es todo gracias", "gracias eso es todo", etc.
        """
        message_lower = user_message.lower().strip()
        
        # Frases de despedida comunes
        end_phrases = [
            "eso es todo gracias",
            "eso es todo, gracias",
            "gracias eso es todo",
            "gracias, eso es todo",
            "eso es todo",
            "gracias, hasta luego",
            "hasta luego",
            "adiós",
            "chao",
            "nos vemos",
            "ya está todo",
            "perfecto gracias",
            "perfecto, gracias",
            "gracias perfecto",
            "listo gracias",
            "listo, gracias"
        ]
        
        # Verificar si el mensaje contiene alguna frase de despedida
        for phrase in end_phrases:
            if phrase in message_lower:
                return True
        
        return False

    # =============================================================
    # TEXT → SPEECH (PlayAI TTS) – CORREGIDO
    # =============================================================
    async def text_to_speech(self, text: str) -> str:
        """
        Convierte texto a audio usando Groq PlayAI TTS (sin streaming, usando .read())
        Devuelve audio en Base64
        """
        try:
            if not self.groq_key:
                raise Exception("GROQ_API_KEY no está configurada")

            client = Groq(api_key=self.groq_key)

            response = client.audio.speech.create(
                model="playai-tts",
                voice="Mikail-PlayAI",
                response_format="wav",
                input=text
            )

            # ESTA ES LA LÍNEA CORRECTA (NO SE ITERA)
            audio_bytes = response.read()

            if not audio_bytes:
                raise Exception("No se obtuvo audio de la respuesta TTS")

            # Codificar a Base64 para enviarlo por WebSocket/HTTP
            return base64.b64encode(audio_bytes).decode("utf-8")

        except Exception as e:
            error_msg = str(e)

            if "terms" in error_msg.lower():
                raise Exception("El modelo playai-tts requiere aceptar términos. Entra a https://console.groq.com/playground?model=playai-tts y acéptalos.")

            raise Exception(f"Error en text to speech: {error_msg}")
