from PyQt6.QtWidgets import QMainWindow
from PyQt6.QtCore import Qt
from ui.hud import HUDWidget

class JARVISWindow(QMainWindow):
    """The main transparent container window for JARVIS."""
    def __init__(self):
        super().__init__()
        
        # Setup window properties: transparent, frameless, and always on top
        self.setWindowFlags(
            Qt.WindowType.FramelessWindowHint | 
            Qt.WindowType.WindowStaysOnTopHint | 
            Qt.WindowType.Tool
        )
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)
        
        # Set exact size requested
        self.resize(800, 800)
        self.center_on_screen()
        
        # Add the futuristic HUD as the main content widget
        self.hud = HUDWidget()
        self.setCentralWidget(self.hud)
        
    def center_on_screen(self):
        """Centers the desktop window on the primary screen."""
        screen = self.screen().geometry()
        x = (screen.width() - self.width()) // 2
        y = (screen.height() - self.height()) // 2
        self.move(x, y)
        
    def keyPressEvent(self, event):
        """Allow closing the frameless app by pressing Escape."""
        if event.key() == Qt.Key.Key_Escape:
            print("[System] Shutting down JARVIS via keyboard shortcut (ESC).")
            self.close()
