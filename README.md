# Bad Minecraft


Some screenshots: https://drive.google.com/drive/folders/1vFWjCMqEB7j7j4iSSJtxBPgsa0ttQrft?usp=sharing


A Minecraft-like exploration game that runs in a browser on a CPU-based JS custom rendering engine.
Thanks to David Rousset, who provided a great tutorial and framework to build this rendering engine.
https://www.davrous.com/2013/06/13/tutorial-series-learning-how-to-write-a-3d-soft-engine-from-scratch-in-c-typescript-or-javascript/


To play Bad Minecraft:

  - Download all files into a new folder of your choice.

  - Open Bad_Minecraft_APP.html to play (Chrome is recommended)
  
  - Click anywhere on the canvas to take control of the camera and move your mouse to look around.  Press escape to unhide the cursor.



CONTROLS:

  W - forward
  A - left
  S - backwards
  D - right
  Space - jump / hold to fly
  R - reset position

  Left Mouse - break block
  Right Mouse - place block
  < and > - change block in hand



NOTES:

  - Recommended browser:  Chrome   (Firefox has much worse performance, Edge should be fine though)

  - Render settings can be adjusted to get either faster performance or further render distance (see below)
  
  - There is a bug where if your camera goes right next to a face, it will sometimes freeze the whole program for a long time or until it crashes.

  - Check out blockIDs.txt to see which block corresponds to each ID. 



HOW TO CHANGE RENDER SETTINGS:

  - While the game is running, press F12 to open the browser console. Here you can call functions or set variables to change render settings and performance:

    * function:  SetRenderDistance(numChunks)
    * variable:  drawFog = false / true




