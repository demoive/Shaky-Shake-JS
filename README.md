# Shaky Shake JS
Simple Motion Detection In Video Through Javascript

The first example ([movement]()) shows how to detect any movement within a video stream. It is able to detect how much movement is occurring. The concept is quite basic:

- Grab each frame of the video media
- Compare the current frame with the previous frame
- Perform a difference of the luminosity (grayscale) for every pixel in the frame
- If the luminosity difference is above a certain threshold (0-255), it is counted as a "movement pixel"
- The count of how many of these movement pixels is what drives the gauge showing how much movement occurred