import pyttsx3

class Speaker:
    def __init__(self):
        """Initializes the Text-to-Speech engine."""
        print("[System] Initializing Voice Module...")
        self.engine = pyttsx3.init()
        
        # Optional: Adjust the speed (rate) of the voice
        self.engine.setProperty('rate', 170)
        
    def speak(self, text):
        """Speaks the given text out loud."""
        print(f"[JARVIS says]: {text}")
        self.engine.say(text)
        self.engine.runAndWait()
