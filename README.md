# Bad Minecraft
A Minecraft-like exploration game that runs in a browser on a CPU-based JS custom rendering engine.
Thanks to David Rousset, who provided a great tutorial and framework to build this rendering engine.
https://www.davrous.com/2013/06/13/tutorial-series-learning-how-to-write-a-3d-soft-engine-from-scratch-in-c-typescript-or-javascript/

~ Developed by Grant Keele ~

To play Bad Minecraft:

  - Download all files into a new folder of your choice.

  - Open Bad_Minecraft_APP.html to play (Chrome is recommended)
  
  - Click anywhere on the screen to take control of the camera and move your mouse to look around.  Press escape to unhide the cursor.



CONTROLS:

  W - forward
  A - left
  S - backwards
  D - right
  Space - jump / hold to fly

  Left Mouse - break block
  Right Mouse - place block
  < and > - change block in hand



NOTES:

  - Performance is going to be pretty bad unless you have a super beefy CPU and lots of memory, since GPU isn't used in the rendering engine (render settings can be adjusted to get better performance).
  
  - There is a bug where if your camera goes right next to a face, it will sometimes freeze the whole program for a long time or until it crashes.

  - Check out blockIDs.txt to see which block corresponds to each ID. 



HOW TO CHANGE SETTINGS:

  - While the game is running, press F12 to open the Chrome console. Here you can modify the following variables to change render settings and performance:

    * renderDistance (default = 5)
    * drawFog (default = true)

  - The rest deal with the world generation, I'll eventually make a config file with everything in it so you can customize the world
