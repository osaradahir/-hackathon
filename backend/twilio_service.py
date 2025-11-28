"""
Servicio para integrar Twilio con el sistema de voz
"""
from twilio.twiml.voice_response import VoiceResponse, Gather
from twilio.rest import Client
import os
from dotenv import load_dotenv

load_dotenv()

class TwilioService:
    def __init__(self):
        self.account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.phone_number = os.getenv("TWILIO_PHONE_NUMBER")
        
        if self.account_sid and self.auth_token:
            self.client = Client(self.account_sid, self.auth_token)
        else:
            self.client = None
            print("⚠️ Twilio no configurado. Configura TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN y TWILIO_PHONE_NUMBER en .env")
    
    def generate_twiml_for_call(self, message: str, gather: bool = False, action_url: str = None):
        """
        Genera TwiML para responder a una llamada
        """
        response = VoiceResponse()
        
        if gather and action_url:
            gather = Gather(
                input='speech',
                action=action_url,
                method='POST',
                speech_timeout='auto',
                language='es-ES',
                hints='',  # Puedes agregar palabras clave aquí
            )
            gather.say(message, language='es-ES')
            response.append(gather)
        else:
            response.say(message, language='es-ES')
        
        # Si no hay gather o la acción no se completó, colgar
        if not gather:
            response.hangup()
        else:
            response.redirect(action_url)
        
        return str(response)
    
    def send_audio_url(self, audio_url: str):
        """
        Genera TwiML para reproducir un audio desde una URL
        """
        response = VoiceResponse()
        response.play(audio_url)
        return str(response)

