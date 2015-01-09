var globalWidth = 1029; //width of the background
var globalHeight = 821; //height of the background
var gameState = {};

//Function called before the game is loaded
//Load the ressources
gameState.load = function() {};
gameState.load.prototype = {
	//we load ressources for the game
	preload: function() {
		this.game.load.image('background', 'ressources/img/background.png');
        this.game.load.image('ice-cube', 'ressources/img/ice-cube.png');
        this.game.load.image('radioactive-rock', 'ressources/img/radioactive-rock.png');
        this.game.load.image('dynamite-rock', 'ressources/img/dynamite-rock.png');
        this.game.load.spritesheet('kaboom', 'ressources/img/explode.png', 128, 128);
        this.game.load.atlasJSONHash('vessel', 'ressources/img/vessel.png', 'data/vessel.json');
		this.game.load.atlasJSONHash('fire', 'ressources/img/fire.png', 'data/fire.json');
		this.game.load.atlasJSONHash('medium-rock', 'ressources/img/medium-rock.png', 'data/medium-rock.json');

        this.game.load.audio('background-music', 'ressources/audio/background-music.ogg');

	},

	create: function() {
		this.game.physics.startSystem(Phaser.Physics.ARCADE);
		this.game.state.start('menu');
	}
};

gameState.menu = function(){};

gameState.menu.prototype = {
	score: undefined,

	create: function() {
		//show the space tile, repeated
		this.background = this.game.add.tileSprite(0, 0, globalWidth, globalHeight, 'background');

		//start game text
		var texts = ["Rocks what is your Job ?!!! AOU ! AOU ! AOU !",
			"Rocks ! YOU SHALL NOT PASS !",
			"My name is grock !",
			"My name’s Rock. James Rock ",
			"To infinty…and beyond (and rocks)!",
			"You talkin’ to me , rocks?",
		];
		var selectedText = Math.floor(Math.random() * (texts.length - 1));
        var gameOverText = (this.score != undefined) ? 'The earth was destroy ! Your fault Captain' : '';
		var text = gameOverText  + "\n\n " + texts[selectedText] + "\n Tap to begin";
		var style = { font: "30px Arial", fill: "#fff", align: "center" };
		var t = this.game.add.text(globalWidth/2, globalHeight/2, text, style);
		t.anchor.set(0.5);

		//highest score
        this.score = 0;
		text = "Highest score: "+this.score*50;
		style = { font: "15px Arial", fill: "#fff", align: "center" };

		var h = this.game.add.text(globalWidth/2, globalHeight/2 + 100, text, style);
		h.anchor.set(0.5);
	},
	update: function() {
		if(this.game.input.activePointer.justPressed()) {
			this.game.state.start('main');
		}
	}
};

//HeartGame
gameState.main = function() {};
gameState.main.prototype = {
	keys: {},
	nbColumn: 5, //nb of total column where the rocks fall
	activeColumn: 3, //index of the column where the vessel is 1 to nbColumn
	vesselSpeed: 15, //speed of the vessel when we move it
	shootSpeed: 5, //speed of the fire
	rockSpeed: 5, //speed of the fire
    initialRockSpeed: 5,
	shoot: [], //array of shoot
	shootToRemove: [],
	rocks: [], //array of rocks
	rocksToRemove: [],
    bonus: undefined,
	score: 0,
	scaleRock: 1,
    malus: undefined,
    invert: false,

	create: function() {
		this.resetVar();

		//we load the background
		this.background = this.game.add.sprite(0,0,'background');

		//we set the key -> to go right <- to go left space to shoot
		this.keys.keyLeft = this.game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
		this.keys.keyRight = this.game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
		this.keys.keySpace = this.game.input.keyboard.addKey(Phaser.Keyboard.X);
		this.keys.keyLeft.onDown.add(this.vesselMove,this);
		this.keys.keyRight.onDown.add(this.vesselMove,this);
		this.keys.keySpace.onDown.add(this.vesselShoot,this);

		//we load the vessel ressources left and right movement animation and we place it on the screen=
		this.vessel = this.game.add.sprite(0,0,'vessel');
		this.vessel.animations.add('going-right',[0,1]);
		this.vessel.animations.add('going-left',[0,2]);
		this.vessel.anchor.setTo(0.5,0.5);
		this.vessel.y = 700;
		this.vessel.x = this.getVesselPosx();
		game.physics.enable(this.vessel, Phaser.Physics.ARCADE);

        var music = game.add.audio('background-music');
        music.play();
	},

	update: function() {
		this.vesselAnimation();
		this.shootAnimation();

		this.rocksGeneration();
		this.rockAnimation();

		this.bonusGeneration();
        this.bonusAnimation();

        this.malusGeneration();
        this.malusAnimation();

		this.handleCollision();


		this.destroyRocksSprite();
		this.destroyShootSprite();

		this.handleScore();
	},
	
	resetVar: function() {
		this.keys = {} ;
		this.nbColumn = 5 ;
		this.activeColumn = 3 ;
		this.vesselSpeed = 15 ;
		this.shootSpeed = 5 ;
		this.rockSpeed = 5 ;
		this.initialRockSpeed = 5 ;
		this.shoot = [] ;
		this.shootToRemove = [] ;
		this.rocks = [] ;
		this.rocksToRemove = [] ;
		this.bonus = undefined ;
		this.score = 0 ;
        this.scaleRock = 1;
        this.malus = undefined;
        this.invert = false;
	},

	//we get the x coordinate if the active column, where we should place the vessel
	getVesselPosx: function() {
		var singleWidthColumn = globalWidth  / this.nbColumn;
		var widthColumn = this.activeColumn * singleWidthColumn;
		return (widthColumn - singleWidthColumn / 2);
	},

	//we handle the movement of the vessel here
	vesselMove: function() {
        var right = (this.invert)? Phaser.Keyboard.LEFT : Phaser.Keyboard.RIGHT;
        var left = (this.invert)? Phaser.Keyboard.RIGHT : Phaser.Keyboard.LEFT;
		//RIGHT MOVEMENT
		if(game.input.keyboard.isDown(right)) {
			if(this.activeColumn<this.nbColumn) {
				this.activeColumn++;
				this.vessel.animations.play('going-right');
			}
		}
		//LEFT MOVEMENT
		if(game.input.keyboard.isDown(left)) {
			if(this.activeColumn>1) {
				this.activeColumn--;
				this.vessel.animations.play('going-left');
			}
		}
	},

	vesselShoot: function() {
		//SHOT
		//we load the shoot
		var shoot = this.game.add.sprite(0,0,'fire');
        shoot.anchor.setTo(0.5,0.5);
		shoot.x =  this.vessel.x;
		shoot.y = this.vessel.y - this.vessel.height;

		shoot.animations.add('fire');
		shoot.animations.play('fire', 10 , true);

		game.physics.enable(shoot, Phaser.Physics.ARCADE);

		this.shoot.push(shoot);
	},

	//we animate the vessel movement
	vesselAnimation: function() {
		if(this.vessel.x + this.vesselSpeed < this.getVesselPosx()) this.vessel.x += this.vesselSpeed;
		else if(this.vessel.x - this.vesselSpeed > this.getVesselPosx()) this.vessel.x -= this.vesselSpeed;
		else {
			this.vessel.frame = 0;
		}
	},

	shootAnimation: function() {
		for(var i = 0; i<this.shoot.length; i++) {
			if(this.shoot[i].y > 300) this.shoot[i].y -= this.shootSpeed;
			else {
				this.shootToRemove.push(this.shoot[i]);
			}
		}
	},

	getRockPosX: function(rock) {
		var singleWidthColumn = globalWidth  / this.nbColumn;
		var widthColumn = parseInt(Math.random() * 10 % this.nbColumn + 1) * singleWidthColumn;
		return (widthColumn - singleWidthColumn / 2);
	},

	rocksGeneration: function() {
		var doWeGenerateARock = Math.random();
		if(doWeGenerateARock>0.05) return;

		var rock = this.game.add.sprite(0,0,'medium-rock');
        rock.anchor.setTo(0.5,0.5);

		rock.animations.add('medium-rock-1',[0,1]);

		rock.x = this.getRockPosX(rock);
		rock.y = - rock.height * 2;
		rock.scale.x = this.scaleRock;
		rock.scale.y = this.scaleRock;

		var nbTexture = parseInt(Math.random() * 10 % 3) + 1 ;
		rock.animations.play('medium-rock-'+nbTexture);

		game.physics.enable(rock, Phaser.Physics.ARCADE);


		this.rocks.push(rock);
	},

	rockAnimation: function() {
		for(var i = 0; i<this.rocks.length; i++) {
			this.checkRockOverlap(this.rocks[i]);
			if(this.rocks[i].y < globalHeight)  {
                this.rocks[i].rotation += 0.02;
				this.rocks[i].y += this.rockSpeed;
			} else {
				this.setGameOver();
			}
		}
	},

	checkRockOverlap: function(rock) {
		for(var i = 0; i<this.rocks.length; i++) {
			if(rock == this.rocks[i]) continue;
			if(rock.overlap(this.rocks[i])) {
				this.rocks[i].kill();
				this.rocks.splice(i,1);
				return true;
			}
		}
		return false;
	},

	rockHit: function(rock, shot) {
		this.score++;
		this.rocksToRemove.push(rock);
		this.shootToRemove.push(shot);
	},

	destroyShootSprite: function() {
		var indexOfShot = -1;
		for(var i=0; i<this.shootToRemove.length; i++) {
			indexOfShot = this.shoot.indexOf(this.shootToRemove[i]);

			if(indexOfShot != -1) {
				this.shoot[indexOfShot].kill();
				this.shoot.splice(indexOfShot,1);
			}
		}
		this.shootToRemove = [];
	},

	destroyRocksSprite: function() {
		var indexOfRock = -1;

		for(var i=0; i<this.rocksToRemove.length; i++) {
			indexOfRock = this.rocks.indexOf(this.rocksToRemove[i]);

			if(indexOfRock != -1) {
                this.rocks[indexOfRock].kill();
                this.explosionAnimation(this.rocks[indexOfRock]);
				this.rocks.splice(indexOfRock,1);
			}
		}
		this.rocksToRemove = [];
	},

    slowRocks: function(){
        this.initialRockSpeed = this.rockSpeed;
        this.rockSpeed = 2;
        game.time.events.add(Phaser.Timer.SECOND * 5, this.stopSlow, this);
    },

    stopSlow: function(){
        this.rockSpeed = this.initialRockSpeed;
    },

    bonusGeneration: function(){
        var bonus;
        var doWeGenerateABonus = Math.random();
        if(doWeGenerateABonus>0.5 || this.bonus !== undefined) return;

        var randomBonus = Math.random();
        if(randomBonus>0.5){
            bonus = this.game.add.sprite(0,0,'ice-cube');
            bonus.anchor.setTo(0.5,0.5);
            bonus.function = 'this.slowRocks()';
        }else{
            bonus = this.game.add.sprite(0,0,'dynamite-rock');
            bonus.anchor.setTo(0.5,0.5);
            bonus.function = 'this.explodeRocks(false,true)';
        }

        bonus.x = this.getRockPosX(bonus);
        bonus.y = - 2 * bonus.height;


        game.physics.enable(bonus, Phaser.Physics.ARCADE);

        this.bonus = bonus;
    },

    bonusAnimation: function() {
        if(this.bonus === undefined) return;

        if(this.bonus.y - this.bonus.height < globalHeight)  {
            this.bonus.y += this.rockSpeed;
            this.bonus.rotation += 0.05;
        } else {
            this.bonus.kill();
            this.bonus = undefined;
        }
    },

    bonusHit: function(bonus, shoot){
        bonus.kill();
        this.shootToRemove.push(shoot);
        this.explosionAnimation(bonus);
        shoot.kill();
        eval(bonus.function);
    },

    explodeRocks: function(deleteShot, addScore){
        for(var i=0; i<this.rocks.length; i++) {
			if(addScore) this.score++;
            this.rocksToRemove.push(this.rocks[i]);
        }

		if(!deleteShot) return;

		for(var i=0; i<this.shoot.length; i++) {
			this.shootToRemove.push(this.shoot[i]);
		}
    },

    explosionAnimation: function(element) {
        var kaboom = this.game.add.sprite(element.x,element.y,'kaboom');
        kaboom.scale.x = 1.7;
        kaboom.scale.y = 1.7;
        kaboom.anchor.setTo(0.5,0.5);
        kaboom.animations.add('kaboom');
        kaboom.play('kaboom', 30, false, true);
    },

	destroyedVessel: function(vessel, rock) {
		this.setGameOver();
	},

	setGameOver: function() {
		this.vessel.kill();
		this.explosionAnimation(this.vessel);
		this.explodeRocks(true, false);
		game.time.events.add(800, this.displayGameOver, this);
	},

	displayGameOver: function() {
		game.state.states['menu'].score = this.score;
		game.state.start('menu');
	},

	handleScore: function() {
		this.nbColumn = Math.round(this.score/20) + 5;
		this.scaleRock = 5 /  this.nbColumn;
		document.getElementById('score').innerHTML = "Score : " + this.score * 50;
		document.getElementById('col').innerHTML = "Lvl : " + this.nbColumn;
	},

	bonusOverlap: function(bonus, rock) {
		var i = this.rocks.indexOf(rock);
		this.rocks[i].kill();
		this.rocks.splice(i,1);
	},

    malusGeneration: function() {
        var malus;
        var doWeGenerateAMalus = Math.random();
        if(doWeGenerateAMalus>0.5 || this.malus !== undefined) return;

        malus = this.game.add.sprite(0,0,'radioactive-rock');
        malus.anchor.setTo(0.5,0.5);
        malus.function = 'this.swapKey()';

        malus.x = this.getRockPosX(malus);
        malus.y = - 2 * malus.height;


        game.physics.enable(malus, Phaser.Physics.ARCADE);

        this.malus = malus;
    },

    malusAnimation: function() {
        if(this.malus === undefined) return;

        if(this.malus.y - this.malus.height < globalHeight)  {
            this.malus.y += this.rockSpeed;
            this.malus.rotation += 0.04;
        } else {
            this.malus.kill();
            this.malus = undefined;
        }
    },

    malusHit: function(malus, shoot){
        malus.kill();
        this.shootToRemove.push(shoot);
        this.explosionAnimation(malus);
        shoot.kill();
        eval(malus.function);
    },

    swapKey: function() {
        this.invert = true;
        this.vessel.initialTint = this.vessel.tint;
        this.vessel.tint = 0x00ff00;
        game.time.events.add(800, this.stopSwap, this);
    },

    stopSwap: function() {
        this.vessel.tint = this.vessel.initialTint;
        this.invert = false;
    },

    malusOverlap: function(malus, rock) {
        var i = this.rocks.indexOf(rock);
        this.rocks[i].kill();
        this.rocks.splice(i,1);
    },

    malusBonusOverlap: function(bonus, malus) {
        malus.kill();
        this.malus = undefined;
    },

    handleCollision: function() {
        game.physics.arcade.overlap(this.vessel, this.rocks, this.destroyedVessel, null, this);
        game.physics.arcade.overlap(this.rocks, this.shoot, this.rockHit, null, this);

        if(this.bonus != undefined) {
            game.physics.arcade.overlap(this.bonus, this.rocks, this.bonusOverlap, null, this);
            game.physics.arcade.overlap(this.bonus, this.shoot, this.bonusHit, null, this);
        }

        if(this.malus != undefined) {
            game.physics.arcade.overlap(this.malus, this.rocks, this.malusOverlap, null, this);
            game.physics.arcade.overlap(this.malus, this.shoot, this.malusHit, null, this);
        }

        if(this.bonus != undefined && this.malus != undefined) {
            game.physics.arcade.overlap(this.bonus, this.malus, this.malusBonusOverlap, null, this);
        }
    }


};


var game = new Phaser.Game(globalWidth, globalHeight, Phaser.AUTO, 'rfts');
game.state.add('load', gameState.load);
game.state.add('menu', gameState.menu);
game.state.add('main', gameState.main);
game.state.start('load');
