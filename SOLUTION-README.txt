Author: Danny Gillies
This is my solution to the challenge you sent.

I added simple pointer lock controls because I was using them to test out the scene anyways
so I figured I'd leave them in, makes it way cooler. Click on the scene to activate the controls.
	Controls:
		w - forward
		s - backward
		a - left
		d - right
		space - up
		shift - down
		esc - regain control of cursor

How I approached the problem:
I was excited to do this project because it has been a few months since I built anything using THREE.js. When
I first loaded it up, I was thrown off by the react setup, because I'm not well versed in react but I was quickly 
able to get the scene up and running. I just wanted to take everything step by step, and make sure one thing was
robust before working on the next problem.

Task 1:
	- I solved the issue of the ECEF coordinates causing the scene to be slanted by rotating the model. I wanted
	to convert the coordinates to take care of this problem but rotating the scene was the fastest way that I
	knew I could get done without spending too much time on that part.
	- The large ECEF coordinates problem actually seemed to fix itself because I moved the vertices to be relative to the
	center of the scene, instead of the center of the built bounding sphere.

Task 2:
	- Once I saw that geo-utils.js has a function to convert from ECEF to LLA, I just wrote a small colorpicker
	based on the altitude to set the color to. The color order from lowest to highest altitude is Red -> Green -> Blue.

Build instructions are the same:
	npm install
	npm run transpile

	Open up index.html

Things I would improve:
	I would actually convert the ECEF coordinates into something more usable, so I don't have to rotate the model to fix it.
	I would add a key for the altitude colorings.
	I would get more familiar with react to organize my code better and make it easily scalable.
	Some sort of interactivity with the world more than just flying around.