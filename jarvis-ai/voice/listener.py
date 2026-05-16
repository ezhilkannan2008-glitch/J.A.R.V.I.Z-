import speech_recognition as sr
import threading

class Listener:
    """Handles continuous background listening for voice commands."""
    
    def __init__(self, callback):
        self.recognizer = sr.Recognizer()
        self.callback = callback # Function to call when words are spoken
        self.is_listening = True

    def start_background_listening(self):
        """Starts listening in a separate thread so the UI doesn't freeze."""
        print("[System] Starting background listener thread...")
        thread = threading.Thread(target=self._listen_loop, daemon=True)
        thread.start()

    def _listen_loop(self):
        """Continuous loop listening for microphone input."""
        with sr.Microphone() as source:
            print("[Voice] Adjusting for ambient noise...")
            self.recognizer.adjust_for_ambient_noise(source, duration=1)
            print("[Voice] Listening for wake word 'Jarvis'...")

            while self.is_listening:
                try:
                    # Listen for audio (times out after 1 second of silence, stops listening after 5 seconds)
                    audio = self.recognizer.listen(source, timeout=1, phrase_time_limit=5)
                    
                    # Recognize speech using Google's free API
                    text = self.recognizer.recognize_google(audio).lower()
                    print(f"[Heard]: '{text}'")
                    
                    # Send the recognized text back to the main app logic
                    self.callback(text)
                    
                except sr.WaitTimeoutError:
                    # No speech detected in the 1 second block, just loop and listen again
                    pass
                except sr.UnknownValueError:
                    # Speech was detected but wasn't intelligible
                    pass
                except sr.RequestError as e:
                    # Error reaching the Google API
                    print(f"[Error] Could not request results from Google Speech Recognition service; {e}")
                except Exception as e:
                    print(f"[Error] Listener exception: {e}")
