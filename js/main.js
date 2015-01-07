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
		this.game.load.atlasJSONHash('vessel', 'ressources/img/vessel.png', 'data/vessel.json');
		this.game.load.atlasJSONHash('fire', 'ressources/img/fire.png', 'data/fire.json');
		this.game.load.atlasJSONHash('medium-rock', 'ressources/img/medium-rock.png', 'data/medium-rock.json');
	},

	create: function() {
		this.game.physics.startSystem(Phaser.Physics.ARCADE);
		this.game.state.start('main');
	}
};

//HeartGame
gameState.main = function() {};
gameState.main.prototype = {
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

	create: function() {

		//we load the background
		this.background = this.game.add.sprite(0,0,'background');

		//we set the key -> to go right <- to go left space to shoot
		keyLeft = this.game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
		keyRight = this.game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
		keySpace = this.game.input.keyboard.addKey(Phaser.Keyboard.X);
		keyLeft.onDown.add(this.vesselMove,this);
		keyRight.onDown.add(this.vesselMove,this);
		keySpace.onDown.add(this.vesselShoot,this);

		//we load the vessel ressources left and right movement animation and we place it on the screen=
		this.vessel = this.game.add.sprite(0,0,'vessel');
		this.vessel.animations.add('going-right',[0,1]);
		this.vessel.animations.add('going-left',[0,2]);
		this.vessel.y = 700;
		this.vessel.x = this.getVesselPosx();
	},

	update: function() {
		this.vesselAnimation();
		this.shootAnimation();
		this.rocksGeneration();
		this.rockAnimation();
        this.bonusGeneration();
        this.bonusAnimation();
		game.physics.arcade.overlap(this.rocks, this.shoot, this.rockHit, null, this);
        game.physics.arcade.overlap(this.bonus, this.shoot, this.bonusHit, null, this);

		this.destroyRocksSprite();
		this.destroyShootSprite();
	},

	//we get the x coordinate if the active column, where we should place the vessel
	getVesselPosx: function() {
		var singleWidthColumn = globalWidth  / this.nbColumn;
		var widthColumn = this.activeColumn * singleWidthColumn;
		return (widthColumn - singleWidthColumn / 2)  - this.vessel.width / 2;
	},

	//we handle the movement of the vessel here
	vesselMove: function() {
		//RIGHT MOVEMENT
		if(game.input.keyboard.isDown(Phaser.Keyboard.RIGHT)) {
			if(this.activeColumn<this.nbColumn) {
				this.activeColumn++;
				this.vessel.animations.play('going-right');
			}
		}
		//LEFT MOVEMENT
		if(game.input.keyboard.isDown(Phaser.Keyboard.LEFT)) {
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

		shoot.x = (this.vessel.width / 2) + this.vessel.x;
		shoot.y = this.vessel.y - this.vessel.height;

		shoot.animations.add('fire');
		shoot.animations.play('fire',6,true);

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
		return (widthColumn - singleWidthColumn / 2)  - rock.width / 2;
	},

	rocksGeneration: function() {
		var doWeGenerateARock = Math.random();
		if(doWeGenerateARock>0.05) return;

		var rock = this.game.add.sprite(0,0,'medium-rock');

		rock.animations.add('medium-rock-1',[0,1]);

		rock.x = this.getRockPosX(rock);
		rock.y = - rock.height;

		var nbTexture = parseInt(Math.random() * 10 % 3) + 1 ;
		rock.animations.play('medium-rock-'+nbTexture);

		game.physics.enable(rock, Phaser.Physics.ARCADE);


		this.rocks.push(rock);
	},

	rockAnimation: function() {
		for(var i = 0; i<this.rocks.length; i++) {
			//if we two rock are overlaping we delete one
			this.checkRockOverlap(this.rocks[i]);
			if(this.rocks[i].y < globalHeight)  {
				this.rocks[i].y += this.rockSpeed;
			} else {
				this.rocksToRemove.push(this.rocks[i]);
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
        var doWeGenerateABonus = Math.random();
        if(doWeGenerateABonus>0.05 || this.bonus !== undefined) return;

        var bonus = this.game.add.sprite(0,0,'ice-cube');

        bonus.x = this.getRockPosX(bonus);
        bonus.y = - bonus.height;

        game.physics.enable(bonus, Phaser.Physics.ARCADE);

        this.bonus = bonus;
    },

    bonusAnimation: function() {
        if(this.bonus === undefined) return;
        //if we two objects are overlaping we delete one
        if(this.bonus.y < globalHeight)  {
            this.bonus.y += this.rockSpeed;
        } else {
            this.bonus = undefined;
        }

    },

    bonusHit: function(bonus, shoot){
        this.bonus.kill();
        this.shootToRemove.push(shoot);
        shoot.kill();
        this.slowRocks();
    }
};


var game = new Phaser.Game(globalWidth, globalHeight, Phaser.AUTO, 'rfts');
game.state.add('load', gameState.load);
game.state.add('main', gameState.main);
game.state.start('load');
