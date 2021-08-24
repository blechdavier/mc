	const CHUNK_WIDTH = 32;
	const CHUNK_HEIGHT = 32;
	
	const s = 0;//small number

    const atlasWidth = 8;
	const print = console.log;
	
	let blocks = [];
	
	let biomes = [];

    var positions = [];
    var normals = [];
    var uvs = [];
    var indices = [];

	var transparentpositions = [];
    var transparentnormals = [];
    var transparentuvs = [];
    var transparentindices = [];
	
	let blocktextures = [//bad form to write this with lowercase
		{},//air textures
		{xplus:[0, 2], xminus:[0, 2], yplus:[0, 2], yminus:[0, 2], zplus:[0, 2], zminus:[0, 2]},//stone textures
		{xplus:[1, 0], xminus:[1, 0], yplus:[0, 0], yminus:[1, 1], zplus:[1, 0], zminus:[1, 0]},//grass textures
		{xplus:[1, 1], xminus:[1, 1], yplus:[1, 1], yminus:[1, 1], zplus:[1, 1], zminus:[1, 1]},//dirt textures
		{xplus:[2, 1], xminus:[2, 1], yplus:[2, 0], yminus:[2, 0], zplus:[2, 1], zminus:[2, 1]},//vertical oak log textures
		{xplus:[3, 0], xminus:[3, 0], yplus:[3, 0], yminus:[3, 0], zplus:[3, 0], zminus:[3, 0]},//leaf textures
		{xplus:[1, 3], xminus:[1, 3], yplus:[1, 3], yminus:[1, 3], zplus:[1, 3], zminus:[1, 3]},//oak plank textures
		{xplus:[5, 1], xminus:[5, 1], yplus:[5, 1], yminus:[5, 1], zplus:[5, 1], zminus:[5, 1]},//glass textures
		{xplus:[0, 5], xminus:[0, 5], yplus:[0, 5], yminus:[0, 5], zplus:[0, 5], zminus:[0, 5]}//water textures
	];
	
	
	//https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
	
	function mulberry32(a, b, c, d) {
		A = a*1415+b*9265+c*3589+d*7932;
    var t = A += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
	
	function mix(a, b, weight) {
		return b*weight+a*(1-weight);
	}
	
	function valuenoise(seed, x, y, z) {
		lowx = floor(x);
		lowy = floor(y);
		lowz = floor(z);
		highx = lowx+1;
		highy = lowy+1;
		highz = lowz+1;
		return mix(mix(mix(mulberry32(seed, lowx, lowy, lowz), mulberry32(seed, highx, lowy, lowz), x-lowx), mix(mulberry32(seed, lowx, highy, lowz), mulberry32(seed, highx, highy, lowz), x-lowx), y-lowy), mix(mix(mulberry32(seed, lowx, lowy, highz), mulberry32(seed, highx, lowy, highz), x-lowx), mix(mulberry32(seed, lowx, highy, highz), mulberry32(seed, highx, highy, highz), x-lowx), y-lowy), z-lowz);
	}
	
	function fractalnoise(seed, x, y, z) {
		return 0.55*valuenoise(seed, x/24, y/24, z/24)+0.35*valuenoise(seed, x/15, y/15, z/15)+0.1*valuenoise(seed, x/6, y/6, z/6);
	}
	
	function floor(a) {
		if(a<0) {
			return Math.trunc(a)-1;
		}
		return Math.trunc(a);
	}
	
	function createChunk(x, z, seed) {
		for(let i = 0; i<CHUNK_WIDTH; i++) {
			biomes.push([]);
			for(let j = 0; j<CHUNK_WIDTH; j++) {
				biomes[i].push(whatbiome(x*CHUNK_WIDTH+i, z*CHUNK_WIDTH+j, seed));
			}
		}
		for(let i = -1; i<CHUNK_WIDTH+1; i++) {
			for(let j = -1; j<CHUNK_WIDTH+1; j++) {
				for(let k = -1; k<CHUNK_HEIGHT+1; k++) {
					setblock(x*CHUNK_WIDTH+i, z*CHUNK_WIDTH+j, k, whatblock(x*CHUNK_WIDTH+i, k, z*CHUNK_WIDTH+j));//set the block in the storage
				}
			}
		}
		if(false) {
			for(let i = 1; i<CHUNK_WIDTH-1; i++) {
				for(let j = 1; j<CHUNK_WIDTH-1; j++) {
					setblock(x*CHUNK_WIDTH+i, z*CHUNK_WIDTH+j, 77, 6);//make the floor
					setblock(x*CHUNK_WIDTH+i, z*CHUNK_WIDTH+j, 89.5-Math.abs(i-7.5), 6);//make the roof
				}
			}
			for(let i = 1; i<CHUNK_WIDTH-1; i++) {
				for(let j = 1; j<7; j++) {
					setblock(x*CHUNK_WIDTH+2, z*CHUNK_WIDTH+i, j+77, 6);
					setblock(x*CHUNK_WIDTH+CHUNK_WIDTH-3, z*CHUNK_WIDTH+i, j+77, 6);
				}
			}
			y = 76;
			while(!isblock(x*CHUNK_WIDTH+1, z*CHUNK_WIDTH+1, y)) {
				y--;
				setblock(x*CHUNK_WIDTH+1, z*CHUNK_WIDTH+1, y, 6);
			}
		}
	}
	
	function whatbiome(x, z, seed) {
		
		moisture = valuenoise(seed, x/10, 0, z/10);
		heat = valuenoise(seed, z/7, 0, z/7);
		
		desert = distsquared(moisture, heat, 0, 1);
		plains = distsquared(moisture, heat, 0.3, 0.5);
		snowytaiga = distsquared(moisture, heat, 0.7, 0);
		forest = distsquared(moisture, heat, 0.7, 0.6);
		
		max = Math.max(desert, plains, snowytaiga, forest);
		
        let biome = "eeeadad";
		
		if(max==desert)
			biome = "desert";
		else if(max==plains)
            biome = "plains";
		else if(max==snowytaiga)
            biome = "snowytaiga";
		else if(max==forest)
            biome = "forest";
		else
			console.error("{ERROR}: Unknown Biome");
		
		return biome;
	}
	
	function whatblock(x, y, z) {
		
		// if(valuenoise(100, x/10, y/10, z/10)>0.9) {
		// 	return(7);
		// }//floating glass patches for testing
		if(isblock(x, y, z)==false) {
			if(y>16) {
				return(0);//it's air
			}
			return(8);//it's water
		}
		else if(isblock(x, y+1, z)==false) {
			return(2);//it's grass
		}
		else if(isblock(x, y+2, z)==false || isblock(x, y+3, z)==false || isblock(x, y+4, z)==false) {
			return(3);//it's dirt
		}
		else {
			return(1);//it's stone
		}
	}
	
	function distsquared(x1, y1, x2, y2) {
		a = x1-x2;
		b = y1-y2;
		return(a*a+b*b);
	}

	function isblock(x, y, z) {

		//if(valuenoise(seed, x/20, y/20, z/20)<constrain(map(y, 0, 20, 0, 0.5), 0.5, 0)) {
			//return(false);
		//}

		//2d noise
		//return(y<=map(fractalnoise(seed, x, 0, z), 0, 1, 1, 64));//This layers noise to make the terrain look more natural.
		
		//flat plane
		// return y==0;

		//simple 2d noise
		return(y<valuenoise(seed, x/30, 0, z/30)*32);

		//3d noise
		//return(0.5<=fractalnoise(seed, x, y, z));//This layers noise to make the terrain look more natural.
	}
	
	function constrain(a, upper, lower) {
		if(a<lower) {
			return lower;
		}
		if(a>upper) {
			return upper;
		}
		return a;
	}
	
	//https://stackoverflow.com/questions/5649803/remap-or-map-function-in-javascript
	function map(value, low1, high1, low2, high2) {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
	}
	
	function setblock(x, y, z, v) {
		if(blocks[x]!=undefined) {
			if(blocks[x][y]!=undefined) {
				blocks[x][y][z] = v;
			}
			else {
				blocks[x][y] = [];
				blocks[x][y][z] = v;
			}
		}
		else {
			blocks[x] = [];
			blocks[x][y] = [];
			blocks[x][y][z] = v;
		}
	}
	
	function meshChunk(x, z) {
		for(let i = 0; i<CHUNK_WIDTH; i++) {
            for(let j = 0; j<CHUNK_WIDTH; j++) {
                for(let k = 0; k<CHUNK_HEIGHT; k++) {
                    //throughout the following code snippet, the i, k, j is intentional.  This is because i is x, j is z, and k is y.
                    //console.log(blocks);
					chunkOffX = x*CHUNK_WIDTH;
					chunkOffZ = z*CHUNK_WIDTH;
                    currentblock = blocks[i+chunkOffX][j+chunkOffZ][k];
                    if(currentblock>0) {
                        topblock = blocks[i+chunkOffX][j+chunkOffZ][k+1];
                        bottomblock = blocks[i+chunkOffX][j+chunkOffZ][k-1];
                        eastblock = blocks[i+1+chunkOffX][j+chunkOffZ][k];
                        westblock = blocks[i-1+chunkOffX][j+chunkOffZ][k];
                        northblock = blocks[i+chunkOffX][j+1+chunkOffZ][k];
                        southblock = blocks[i+chunkOffX][j-1+chunkOffZ][k];
                        if(transparentblock(currentblock)) {
                            if(differentblock(currentblock, topblock)) {
                                transparentface(i, k+1, j+1, i+1, k+1, j+1, i+1, k+1, j, i, k+1, j);
                                transparentaddUVs(blocktextures[currentblock].yplus);
                                transparentaddNormals(0, 1, 0);
                                // console.log("top current: "+currentblock+", other: "+topblock);
                            }
                            if(differentblock(currentblock, bottomblock)) {
                                transparentface(i, k, j, i+1, k, j, i+1, k, j+1, i, k, j+1);
                                transparentaddUVs(blocktextures[currentblock].yminus);
                                transparentaddNormals(0, -1, 0);
                                // console.log("bottom current: "+currentblock+", other: "+bottomblock);
                            }
                            if(differentblock(currentblock, northblock)) {
                                transparentface(i+1, k+1, j+1, i, k+1, j+1, i, k, j+1, i+1, k, j+1);
                                transparentaddUVs(blocktextures[currentblock].zplus);
                                transparentaddNormals(0, 0, 1);
                                // console.log("north current: "+currentblock+", other: "+northblock);
                            }
                            if(differentblock(currentblock, southblock)) {
                                transparentface(i, k+1, j, i+1, k+1, j, i+1, k, j, i, k, j);
                                transparentaddUVs(blocktextures[currentblock].zminus);
                                transparentaddNormals(0, 0, -1);
                                // console.log("south current: "+currentblock+", other: "+southblock);
                            }
                            if(differentblock(currentblock, eastblock)) {
                                transparentface(i+1, k+1, j, i+1, k+1, j+1, i+1, k, j+1, i+1, k, j);
                                transparentaddUVs(blocktextures[currentblock].xplus);
                                transparentaddNormals(1, 0, 0);
                                // console.log("east current: "+currentblock+", other: "+eastblock);
                            }
                            if(differentblock(currentblock, westblock)) {
                                transparentface(i, k+1, j+1, i, k+1, j, i, k, j, i, k, j+1);
                                transparentaddUVs(blocktextures[currentblock].xminus);
                                transparentaddNormals(-1, 0, 0);
                                // console.log("west current: "+currentblock+", other: "+westblock);
                            }
                        }
                        else {
                            if(transparentblock(topblock)) {
                                face(i, k+1, j+1, i+1, k+1, j+1, i+1, k+1, j, i, k+1, j);
                                addUVs(blocktextures[currentblock].yplus);
                                addNormals(0, 1, 0);
                            }
                            if(transparentblock(bottomblock)) {
                                face(i, k, j, i+1, k, j, i+1, k, j+1, i, k, j+1);
                                addUVs(blocktextures[currentblock].yminus);
                                addNormals(0, -1, 0);
                            }
                            if(transparentblock(northblock)) {
                                face(i+1, k+1, j+1, i, k+1, j+1, i, k, j+1, i+1, k, j+1);
                                addUVs(blocktextures[currentblock].zplus);
                                addNormals(0, 0, 1);
                            }
                            if(transparentblock(southblock)) {
                                face(i, k+1, j, i+1, k+1, j, i+1, k, j, i, k, j);
                                addUVs(blocktextures[currentblock].zminus);
                                addNormals(0, 0, -1);
                            }
                            if(transparentblock(eastblock)) {
                                face(i+1, k+1, j, i+1, k+1, j+1, i+1, k, j+1, i+1, k, j);
                                addUVs(blocktextures[currentblock].xplus);
                                addNormals(1, 0, 0);
                            }
                            if(transparentblock(westblock)) {
                                face(i, k+1, j+1, i, k+1, j, i, k, j, i, k, j+1);
                                addUVs(blocktextures[currentblock].xminus);
                                addNormals(-1, 0, 0);
                            }
                        }
                    }
                }
            }
        }
	}
	
	function transparentblock(b) {
		if(b==0 || b==8 || b==7 || b==undefined) {
			return true;
		}
		return false;
	}
	
	function differentblock(first, last) {
		// if(first==8 && last!=8 && transparentblock(last)) {
		// 	return true;
		// }
		// if(first==7 && last !=7 && transparentblock(last)) {
		// 	return true;
		// }
		// return false;
		return first!==last && transparentblock(last);
	}
	
	function face(x1, y1, z1, x2, y2, z2, x3, y3, z3, x4, y4, z4) {
        l = positions.length/3;
		positions.push(x1, y1, z1);//add the first vertex to the model
		positions.push(x2, y2, z2);//add the second vertex to the model
        positions.push(x3, y3, z3);//add the third vertex to the model
		positions.push(x4, y4, z4);//add the last vertex to the model
        indices.push(l, l+1, l+2, l+2, l+3, l);
	}
	
	function addUVs(arr) {
		x = arr[0]/atlasWidth;
		y = arr[1]/atlasWidth;
        c = 1/atlasWidth;
		uvs.push(x, y);
		uvs.push(x+c, y);
		uvs.push(x+c, y+c);
        uvs.push(x, y+c);
	}

    function addNormals(x, y, z) {
        for(let i = 0; i<4; i++) {
            normals.push(x, y, z);
        }
    }

	function transparentface(x1, y1, z1, x2, y2, z2, x3, y3, z3, x4, y4, z4) {
        l = transparentpositions.length/3;
		transparentpositions.push(x1, y1, z1);//add the first vertex to the model
		transparentpositions.push(x2, y2, z2);//add the second vertex to the model
        transparentpositions.push(x3, y3, z3);//add the third vertex to the model
		transparentpositions.push(x4, y4, z4);//add the last vertex to the model
        transparentindices.push(l, l+1, l+2, l+2, l+3, l);
	}
	
	function transparentaddUVs(arr) {
		x = arr[0]/atlasWidth;
		y = arr[1]/atlasWidth;
        c = 1/atlasWidth;
		transparentuvs.push(x, y);
		transparentuvs.push(x+c, y);
		transparentuvs.push(x+c, y+c);
        transparentuvs.push(x, y+c);
	}

    function transparentaddNormals(x, y, z) {
        for(let i = 0; i<4; i++) {
            transparentnormals.push(x, y, z);
        }
    }
	
	onmessage = function(e) {
        //blocks = [[[]]];
        positions = [];
        normals = [];
        uvs = [];
        indices = [];
		transparentpositions = [];
        transparentnormals = [];
        transparentuvs = [];
        transparentindices = [];
		seed = e.data[0];
		createChunk(e.data[1], e.data[2], seed);
        meshChunk(e.data[1], e.data[2]);
		postMessage([positions, normals, uvs, indices, e.data[1], e.data[2], transparentpositions, transparentnormals, transparentuvs, transparentindices]);
	}


    //this isnt any good place for a note but here's one anyway
    //in unity, add a delay to the explosion function maybe based on ontriggerenter2d and a circle collider