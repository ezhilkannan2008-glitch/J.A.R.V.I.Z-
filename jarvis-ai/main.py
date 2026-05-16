import sys
from PyQt6.QtWidgets import QApplication
from ui.main_window import JARVISWindow
from voice.speaker import Speaker
from voice.listener import Listener
from commands.browser import open_youtube

class JarvisSystem:
    def __init__(self):
        # Initialize text-to-speech speaker
        self.speaker = Speaker()
        
        # State tracker to know if Jarvis has been activated by wake word
        self.is_awake = False
        
        # Setup the UI Window (PyQt6)
        self.app = QApplication(sys.argv)
        self.window = JARVISWindow()
        
        # Start continuous listening in the background
        self.listener = Listener(self.process_voice_command)
        self.listener.start_background_listening()
        
    def process_voice_command(self, text):
        """Processes the recognized words sent from the background listener."""
        
        # 1. Check for wake word if jarring isn't already awake
        if "jarvis" in text:
            self.is_awake = True
            print("[Status] JARVIS is awake and listening for instructions.")
            
            # Allow for direct commands in one sentence (e.g., "Jarvis open Youtube")
            if "open youtube" in text:
                self.execute_open_youtube()
            else:
                self.speaker.speak("I am here. How can I help?")
                
        # 2. If already awake, parse commands
        elif self.is_awake:
            if "open youtube" in text:
                self.execute_open_youtube()
            elif "sleep" in text or "stop" in text or "goodbye" in text:
                self.speaker.speak("Going offline.")
                self.is_awake = False # Reset state
            else:
                # Basic fallback
                print(f"[JARVIS ignoring unrecognized command: {text}]")
                
    def execute_open_youtube(self):
        """Action handler for the YouTube command."""
        self.speaker.speak("Opening YouTube.")
        open_youtube()
        # Reset wake state after completing a command
        self.is_awake = False 
        
    def run(self):
        """Main application entry point."""
        self.window.show()
        print("\n" + "="*40)
        print(" JARVIS Desktop Assistant Phase 1 Online ")
        print("="*40)
        print("1. Say 'Jarvis' to wake up.")
        print("2. Say 'open youtube' to execute the command.")
        print("   (Or just say 'Jarvis open youtube')")
        print("3. Press ESC on the circular HUD window to exit.")
        
        # Start the blocking GUI event loop
        sys.exit(self.app.exec())

if __name__ == "__main__":
    jarvis = JarvisSystem()
    jarvis.run()
