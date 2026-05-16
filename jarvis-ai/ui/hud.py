from PyQt6.QtWidgets import QWidget
from PyQt6.QtGui import QPainter, QPen, QColor, QRadialGradient
from PyQt6.QtCore import Qt, QTimer, QRectF

class HUDWidget(QWidget):
    """The central circular futuristic HUD for JARVIS."""
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setMinimumSize(800, 800)
        
        # Angles for the three rotating rings
        self.angle1 = 0
        self.angle2 = 0
        self.angle3 = 0
        
        # Timer for smooth animation (~60 frames per second)
        self.timer = QTimer(self)
        self.timer.timeout.connect(self.update_animation)
        self.timer.start(16) # 16ms interval
        
    def update_animation(self):
        """Updates rotation angles and triggers a repaint."""
        # Different speeds and directions for the rings
        self.angle1 = (self.angle1 + 1.5) % 360
        self.angle2 = (self.angle2 - 2.5) % 360
        self.angle3 = (self.angle3 + 1.0) % 360
        
        # This tells PyQt to call paintEvent() again
        self.update() 
        
    def paintEvent(self, event):
        """Draws the cinematic futuristic HUD graphics."""
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        
        width = self.width()
        height = self.height()
        center_x = width / 2
        center_y = height / 2
        
        # 1. Provide a central neon blue/cyan glow effect
        gradient = QRadialGradient(center_x, center_y, 250)
        gradient.setColorAt(0, QColor(0, 255, 255, 50)) # Bright cyan at center (semi-transparent)
        gradient.setColorAt(1, QColor(0, 0, 0, 0))      # Fades to invisible at edge
        painter.setBrush(gradient)
        painter.setPen(Qt.PenStyle.NoPen)
        painter.drawEllipse(int(center_x - 250), int(center_y - 250), 500, 500)
        
        # Helper function to draw rotating dashed rings
        def draw_ring(radius, angle, pen_width, dash_pattern, color):
            painter.save() # Save current state
            # Move origin to center and rotate
            painter.translate(center_x, center_y)
            painter.rotate(angle)
            
            pen = QPen(color)
            pen.setWidth(pen_width)
            if dash_pattern:
                pen.setDashPattern(dash_pattern)
            painter.setPen(pen)
            painter.setBrush(Qt.PenStyle.NoBrush)
            
            # Draw the ring centered around the temporary origin
            rect = QRectF(-radius, -radius, radius * 2, radius * 2)
            painter.drawEllipse(rect)
            painter.restore() # Restore original state
        
        # Define our futuristic colors
        cyan = QColor(0, 255, 255, 220)
        cyan_light = QColor(100, 255, 255, 150)
        cyan_faded = QColor(0, 255, 255, 60)
        
        # Draw outer static boundary ring
        draw_ring(300, 0, 1, None, cyan_faded)
        
        # Draw rotating ring 1 (Outer ring, slow chunks)
        draw_ring(270, self.angle1, 4, [15, 10, 40, 10], cyan)
        
        # Draw rotating ring 2 (Middle ring, fast small dashes)
        draw_ring(230, self.angle2, 10, [2, 5], cyan_light)
        
        # Draw rotating ring 3 (Inner ring, thick broken chunks)
        draw_ring(190, self.angle3, 15, [40, 20, 5, 20], cyan)
        
        # Draw the solid center core
        painter.setPen(QPen(cyan, 2))
        painter.setBrush(QColor(0, 255, 255, 40))
        painter.drawEllipse(int(center_x - 80), int(center_y - 80), 160, 160)
