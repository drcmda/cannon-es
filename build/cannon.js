/**
 * cannon.js v0.1.3 - A lightweight 3D physics engine for the web
 * 
 * http://github.com/schteppe/cannon.js
 * 
 * Copyright (c) 2012 Stefan Hedman (steffe.se)
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * The Software shall be used for Good, not Evil.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Our main namespace definition
 * @author schteppe / https://github.com/schteppe
 */

var CANNON = CANNON || {};

// Maintain compatibility with older browsers
if(!self.Int32Array){
  self.Int32Array = Array;
  self.Float32Array = Array;
}
/**
 * @class BroadPhase
 * @author schteppe / https://github.com/schteppe
 * @todo Make it a base class for broadphase implementations, and rename this one to NaiveBroadphase
 */
CANNON.BroadPhase = function(){
  
};

/**
 * Get all the collision pairs in a physics world
 * @param World world
 * @todo Should be placed in a subclass to BroadPhase
 */
CANNON.BroadPhase.prototype.collisionPairs = function(world){
  var pairs1 = [];
  var pairs2 = [];
  var n = world.numObjects();

  // Local fast access
  var SPHERE = CANNON.RigidBody.prototype.types.SPHERE;
  var PLANE =  CANNON.RigidBody.prototype.types.PLANE;
  var BOX =    CANNON.RigidBody.prototype.types.BOX;
  var x = world.x;
  var y = world.y;
  var z = world.z;
  var geodata = world.geodata;
  var type = world.type;

  // Naive N^2 ftw!
  for(var i=0; i<n; i++){
    for(var j=0; j<i; j++){

      // Sphere-sphere
      if(type[i]==SPHERE && type[j]==SPHERE){
	var r2 = (geodata[i].radius + geodata[j].radius);
	if(Math.abs(x[i]-x[j]) < r2 && 
	   Math.abs(y[i]-y[j]) < r2 && 
	   Math.abs(z[i]-z[j]) < r2){
	  pairs1.push(i);
	  pairs2.push(j);
	}

	// Sphere-plane
      } else if((type[i]==SPHERE && type[j]==PLANE) ||
		(type[i]==PLANE &&  type[j]==SPHERE)){
	var si = type[i]==SPHERE ? i : j;
	var pi = type[i]==PLANE ? i : j;
	
	// Rel. position
	var r = new CANNON.Vec3(x[si]-x[pi],
				 y[si]-y[pi],
				 z[si]-z[pi]);
	var normal = geodata[pi].normal;
	var q = r.dot(normal)-geodata[si].radius;
	if(q<0.0){
	  pairs1.push(i);
	  pairs2.push(j);
	}
	
	// Box-plane
      } else if((type[i]==BOX && type[j]==PLANE) ||
		(type[i]==PLANE &&  type[j]==BOX)){
	var bi = type[i]==BOX   ? i : j;
	var pi = type[i]==PLANE ? i : j;
	
	// Rel. position
	var r = new CANNON.Vec3(x[bi]-x[pi],
				y[bi]-y[pi],
				z[bi]-z[pi]);
	var normal = geodata[pi].normal;
	var d = r.dot(normal); // Distance from box center to plane
	var boundingRadius = world.body.halfExtents.norm();
	var q = d - boundingRadius;
	if(q<0.0){
	  pairs1.push(i);
	  pairs2.push(j);
	}
      }
    }
  }

  return [pairs1,pairs2];
};
/**
 * Produce a 3x3 matrix. Columns first!
 * @class Mat3
 * @param elements
 * @author schteppe / http://github.com/schteppe
 */
CANNON.Mat3 = function(elements){
  if(elements)
    this.elements = new Float32Array(elements);
  else
    this.elements = new Float32Array(9);
};

/**
 * Sets the matrix to identity
 * @todo Should perhaps be renamed to setIdentity() to be more clear.
 * @todo Create another function that immediately creates an identity matrix eg. eye()
 */
CANNON.Mat3.prototype.identity = function(){
  this.elements[0] = 1;
  this.elements[1] = 0;
  this.elements[2] = 0;

  this.elements[3] = 0;
  this.elements[4] = 1;
  this.elements[5] = 0;

  this.elements[6] = 0;
  this.elements[7] = 0;
  this.elements[8] = 1;
};

/**
 * Matrix-Vector multiplication
 * @param Vec3 v The vector to multiply with
 * @param Vec3 target Optional, target to save the result in.
 */
CANNON.Mat3.prototype.vmult = function(v,target){
  if(target===undefined)
    target = new CANNON.Vec3();

  var vec = [v.x, v.y, v.z];
  var targetvec = [0, 0, 0];
  for(var i=0; i<3; i++)
    for(var j=0; j<3; j++)
      targetvec[i] += this.elements[i+3*j]*vec[i];

  target.x = targetvec[0];
  target.y = targetvec[1];
  target.z = targetvec[2];
  return target;
};

/**
 * Matrix-scalar multiplication
 * @param float s
 */
CANNON.Mat3.prototype.smult = function(s){
  for(var i=0; i<this.elements.length; i++)
    this.elements[i] *= s;
};

/**
 * Matrix multiplication
 * @param Mat3 m
 * @return Mat3
 */
CANNON.Mat3.prototype.mmult = function(m){
  var r = new CANNON.Mat3();
  for(var i=0; i<3; i++)
    for(var j=0; j<3; j++){
      var sum = 0.0;
      for(var k=0; k<3; k++)
	sum += this.elements[i+k] * m.elements[k+j*3];
      r.elements[i+j*3] = sum; 
    }
  return r;
};

/**
 * Solve Ax=b
 * @param Vec3 b The right hand side
 * @return Vec3 The solution x
 */
CANNON.Mat3.prototype.solve = function(b,target){

  target = target || new CANNON.Vec3();

  // Construct equations
  var nr = 3; // num rows
  var nc = 4; // num cols
  var eqns = new Float32Array(nr*nc);
  for(var i=0; i<3; i++)
    for(var j=0; j<3; j++)
      eqns[i+nc*j] = this.elements[i+3*j];
  eqns[3+4*0] = b.x;
  eqns[3+4*1] = b.y;
  eqns[3+4*2] = b.z;
  
  // Compute right upper triangular version of the matrix - Gauss elimination
  var n = 3;
  var k = n;
  var i;
  var np;
  var kp = 4; // num rows
  var p;
  var els;
  do {
    i = k - n;
    if (eqns[i+nc*i] == 0) {
      for (j = i + 1; j < k; j++) {
	if (eqns[i+nc*j] != 0) {
	  els = [];
	  np = kp;
	  do {
	    p = kp - np;
	    els.push(eqns[p+nc*i] + eqns[p+nc*j]);
	  } while (--np);
	  eqns[i+nc*0] = els[0];
	  eqns[i+nc*1] = els[1];
	  eqns[i+nc*2] = els[2];
	  break;
	}
      }
    }
    if (eqns[i+nc*i] != 0) {
      for (j = i + 1; j < k; j++) {
	var multiplier = eqns[i+nc*j] / eqns[i+nc*i];
	els = [];
	np = kp;
	do {
	  p = kp - np;
	  els.push(p <= i ? 0 : eqns[p+nc*j] - eqns[p+nc*i] * multiplier);
	} while (--np);
	eqns[j+nc*0] = els[0];
	eqns[j+nc*1] = els[1];
	eqns[j+nc*2] = els[2];
      }
    }
  } while (--n);
  // Get the solution
  target.z = eqns[2*nc+3] / eqns[2*nc+2];
  target.y = (eqns[1*nc+3] - eqns[1*nc+2]*target.z) / eqns[1*nc+1];
  target.x = (eqns[0*nc+3] - eqns[0*nc+2]*target.z - eqns[0*nc+1]*target.y) / eqns[0*nc+0];
  return target;
};

/**
 * Get an element in the matrix by index. Index starts at 0, not 1!!!
 * @param int i
 * @param int j
 * @param float value Optional. If provided, the matrix element will be set to this value.
 */
CANNON.Mat3.prototype.e = function(i,j,value){
  if(value==undefined)
    return this.elements[i+3*j];
  else {
    // Set value
    this.elements[i+3*j] = value;
  }
};

/**
 * Copy the matrix
 * @param Mat3 target Optional. Target to save the copy in.
 * @return Mat3
 */
CANNON.Mat3.prototype.copy = function(target){
  target = target || new Mat3();
  for(var i=0; i<this.elements.length; i++)
    target.elements[i] = this.elements[i];
  return target;
};
/**
 * 3-dimensional vector
 * @class Vec3
 * @param float x
 * @param float y
 * @param float z
 * @author schteppe / http://github.com/schteppe
 */
CANNON.Vec3 = function(x,y,z){
  this.x = x||0.0;
  this.y = y||0.0;
  this.z = z||0.0;
};

/**
 * Vector cross product
 * @param Vec3 v
 * @param Vec3 target Optional. Target to save in.
 * @return Vec3
 */
CANNON.Vec3.prototype.cross = function(v,target){
  if(target==undefined)
    target = new CANNON.Vec3();
  var A = [this.x, this.y, this.z];
  var B = [v.x, v.y, v.z];
  
  target.x = (A[1] * B[2]) - (A[2] * B[1]);
  target.y = (A[2] * B[0]) - (A[0] * B[2]);
  target.z = (A[0] * B[1]) - (A[1] * B[0]);

  return target;
};

/**
 * Set the vectors' 3 elements
 * @param float x
 * @param float y
 * @param float z
 */
CANNON.Vec3.prototype.set = function(x,y,z){
  this.x = x;
  this.y = y;
  this.z = z;
};
    
/**
 * Vector addition
 * @param Vec3 v
 * @param Vec3 target Optional.
 * @return Vec3
 */
CANNON.Vec3.prototype.vadd = function(v,target){
  if(target){
    target.x += v.x;
    target.y += v.y;
    target.z += v.z;
  } else {
    return new CANNON.Vec3(this.x+v.x,
			    this.y+v.y,
			    this.z+v.z);
  }  
};
    
/**
 * Vector subtraction
 * @param v
 * @param target Optional. Target to save in.
 * @return Vec3
 */
CANNON.Vec3.prototype.vsub = function(v,target){
  if(target){
    target.x -= v.x;
    target.y -= v.y;
    target.z -= v.z;
  } else {
    return new CANNON.Vec3(this.x-v.x,
			    this.y-v.y,
			    this.z-v.z);
  }  
};

/**
 * Get the cross product matrix a_cross from a vector, such that
 *   a x b = a_cross * b = c
 * @see http://www8.cs.umu.se/kurser/TDBD24/VT06/lectures/Lecture6.pdf
 * @return Mat3
 */
CANNON.Vec3.prototype.crossmat = function(){
  return new CANNON.Mat3([      0,  -this.z,   this.y,
			    this.z,        0,  -this.x,
			   -this.y,   this.x,        0]);
};

/**
 * Normalize the vector. Note that this changes the values in the vector.
 * @return float Returns the norm of the vector
 */
CANNON.Vec3.prototype.normalize = function(){
  var n = Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z);
  if(n>0.0){
    this.x /= n;
    this.y /= n;
    this.z /= n;
  } else {
    // Make something up
    this.x = 0;
    this.y = 0;
    this.z = 0;
  }
  return n;
};

/**
 * Get the 2-norm (length) of the vector
 * @return float
 */
CANNON.Vec3.prototype.norm = function(){
  return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z);
};

/**
 * Multiply the vector with a scalar
 * @param float scalar
 * @param Vec3 saveinme
 * @return Vec3
 */
CANNON.Vec3.prototype.mult = function(scalar,saveinme){
  if(!saveinme)
    saveinme = new CANNON.Vec3();
  saveinme.x = scalar*this.x;
  saveinme.y = scalar*this.y;
  saveinme.z = scalar*this.z;
  return saveinme;
};

/**
 * Calculate dot product
 * @param Vec3 v
 * @return float
 */
CANNON.Vec3.prototype.dot = function(v){
  return (this.x * v.x + this.y * v.y + this.z * v.z);
};

/**
 * Make the vector point in the opposite direction.
 * @param Vec3 target Optional target to save in
 * @return Vec3
 */
CANNON.Vec3.prototype.negate = function(target){
  target = target || new CANNON.Vec3();
  target.x = - this.x;
  target.y = - this.y;
  target.z = - this.z;
  return target;
};

/**
 * Compute two artificial tangents to the vector
 * @param Vec3 t1 Vector object to save the first tangent in
 * @param Vec3 t2 Vector object to save the second tangent in
 */
CANNON.Vec3.prototype.tangents = function(t1,t2){
  var norm = this.norm();
  var n = new CANNON.Vec3(this.x/norm,
			   this.y/norm,
			   this.z/norm);
  if(n.x<0.9)
    n.cross(new CANNON.Vec3(1,0,0),t1);
  else
    n.cross(new CANNON.Vec3(0,1,0),t1);
  n.cross(t1,t2);
};

/**
 * Converts to a more readable format
 * @return string
 */
CANNON.Vec3.prototype.toString = function(){
  return this.x+","+this.y+","+this.z;
};/**
 * 4-dimensional quaternion
 * @class Quaternion
 * @param float x
 * @param float y
 * @param float z 
 * @param float w
 */
CANNON.Quaternion = function(x,y,z,w){
  this.x = x==undefined ? x : 1;
  this.y = y==undefined ? y : 0;
  this.z = z==undefined ? z : 0;
  this.w = w==undefined ? w : 0;
};

/**
 * Convert to a readable format
 */
CANNON.Quaternion.prototype.toString = function(){
  return this.x+","+this.y+","+this.z+","+this.w;
};

/**
 * Quaternion multiplication
 * @param Quaternion q
 * @param Quaternion target Optional.
 * @return Quaternion
 */ 
CANNON.Quaternion.prototype.mult = function(q,target){
  if(target==undefined)
    target = new CANNON.Quaternion();
  
  var va = new CANNON.Vec3(this.x,this.y,this.z);
  var vb = new CANNON.Vec3(q.x,q.y,q.z);
  target.w = this.w*q.w - va.dot(vb);
  vaxvb = va.cross(vb);
  target.x = this.w * vb.x + q.w*va.x + vaxvb.x;
  target.y = this.w * vb.y + q.w*va.y + vaxvb.y;
  target.z = this.w * vb.z + q.w*va.z + vaxvb.z;
  return target;
};

/**
 * Normalize the quaternion. Note that this changes the values of the quaternion.
 */
CANNON.Quaternion.prototype.normalize = function(){
  var l = Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w);
  if ( l === 0 ) {
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.w = 0;
  } else {
    l = 1 / l;
    this.x *= l;
    this.y *= l;
    this.z *= l;
    this.w *= l;
  }
};

/**
 * Rigid body base class
 * @class RigidBody
 * @param type
 * @param Vec3 position
 * @param float mass
 * @param object geodata
 * @param Vec3 velocity
 * @param Vec3 force
 * @param Vec3 rotvelo
 * @param Quaternion quat
 * @param Vec3 tau
 * @param Vec3 inertia
 */
CANNON.RigidBody = function(type){
  this.type = type;
  this.position = new CANNON.Vec3();
  this.velocity = new CANNON.Vec3();
  this.force = new CANNON.Vec3();
  this.tau = new CANNON.Vec3();
  this.quaternion = new CANNON.Quaternion();
  this.rotvelo = new CANNON.Vec3();
  this.mass = 1.0;
  this.geodata = {};
  this.id = -1;
  this.world = null;
  this.inertia = new CANNON.Vec3(1,1,1);
};

/**
 * Enum for object types: SPHERE, PLANE
 */
CANNON.RigidBody.prototype.types = {
  SPHERE:1,
  PLANE:2,
  BOX:4
};
/**
 * Spherical rigid body
 * @class Sphere
 * @param Vec3 position
 * @param float radius
 * @param float mass
 */
CANNON.Sphere = function(position,radius,mass){
  CANNON.RigidBody.apply(this,
			  [CANNON.RigidBody.prototype.types.SPHERE]);
  this.position = position;
  this.mass = mass;
  this.geodata = {radius:radius};
  var I = 2.0*mass*radius*radius/5.0;
  this.inertia = new CANNON.Vec3(I,I,I);
};
/**
 * Box
 * @param Vec3 halfExtents
 * @param float mass
 * @author schteppe
 */
CANNON.Box = function(halfExtents,mass){
  // Extend rigid body class
  CANNON.RigidBody.apply(this,
			  [CANNON.RigidBody.types.BOX]);
  this._halfExtents = halfExtents;
  this.mass = mass!=undefined ? mass : 0;
};
/**
 * Plane
 * @class Plane
 * @param Vec3 position
 * @param Vec3 normal
 * @todo Should be able to create it using only scalar+vector
 */
CANNON.Plane = function(position, normal){
  normal.normalize();
  CANNON.RigidBody.apply(this,
			  [CANNON.RigidBody.prototype.types.PLANE]);
  this.position = position;
  this.mass = 0.0;
  this.geodata = {normal:normal};
};

/**
 * Constraint solver.
 * @todo The spook parameters should be specified for each constraint, not globally.
 * @author schteppe / https://github.com/schteppe
 */
CANNON.Solver = function(a,b,eps,k,d,iter,h){
  this.iter = iter || 10;
  this.h = h || 1.0/60.0;
  this.a = a;
  this.b = b;
  this.eps = eps;
  this.k = k;
  this.d = d;
  this.reset(0);
  this.debug = false;

  if(this.debug)
    console.log("a:",a,"b",b,"eps",eps,"k",k,"d",d);
};

/**
 * Resets the solver, removes all constraints and prepares for a new round of solving
 * @param int numbodies The number of bodies in the new system
 */
CANNON.Solver.prototype.reset = function(numbodies){
  this.G = [];
  this.MinvTrace = [];
  this.Fext = [];
  this.q = [];
  this.qdot = [];
  this.n = 0;
  this.upper = [];
  this.lower = [];
  this.hasupper = [];
  this.haslower = [];
  this.i = []; // To keep track of body id's
  this.j = [];
  if(numbodies){
    this.vxlambda = new Float32Array(numbodies);
    this.vylambda = new Float32Array(numbodies);
    this.vzlambda = new Float32Array(numbodies);
    this.wxlambda = new Float32Array(numbodies);
    this.wylambda = new Float32Array(numbodies);
    this.wzlambda = new Float32Array(numbodies);
  }
};

/**
 * Add a constraint to the solver
 * @param array G Jacobian vector, 12 elements (6 dof per body)
 * @param array MinvTrace The trace of the Inverse mass matrix (12 elements). The mass matrix is 12x12 elements from the beginning and 6x6 matrix per body (mass matrix and inertia matrix).
 * @param array q The constraint violation vector in generalized coordinates (12 elements)
 * @param array qdot The time-derivative of the constraint violation vector q.
 * @param array Fext External forces (12 elements)
 * @param float lower Lower constraint force bound
 * @param float upper Upper constraint force bound
 * @param int body_i The first rigid body index
 * @param int body_j The second rigid body index - set to -1 if none
 * @see https://www8.cs.umu.se/kurser/5DV058/VT09/lectures/spooknotes.pdf
 */
CANNON.Solver.prototype.addConstraint = function(G,MinvTrace,q,qdot,Fext,lower,upper,body_i,body_j){
  if(this.debug){
    console.log("Adding constraint ",this.n);
    console.log("G:",G);
    console.log("q:",q);
    console.log("qdot:",qdot);
    console.log("Fext:",Fext);
  }
  
  for(var i=0; i<12; i++){
    this.q.push(q[i]);
    this.qdot.push(qdot[i]);
    this.MinvTrace.push(MinvTrace[i]);
    this.G.push(G[i]);
    this.Fext.push(Fext[i]);

    this.upper.push(upper);
    this.hasupper.push(!isNaN(upper));
    this.lower.push(lower);
    this.haslower.push(!isNaN(lower));
  }

  this.i.push(body_i);
  this.j.push(body_j);

  this.n += 1;

  // Return result index
  return this.n - 1; 
};

/**
 * Solves the system
 */
CANNON.Solver.prototype.solve = function(){
  this.i = new Int16Array(this.i);
  var n = this.n;
  var lambda = new Float32Array(n);
  var dlambda = new Float32Array(n);
  var ulambda = new Float32Array(12*n); // 6 dof per constraint, and 2 bodies
  var B = new Float32Array(n);
  var c = new Float32Array(n);
  var precomp = new Int16Array(n);
  var G = new Float32Array(this.G);
  for(var k = 0; k<this.iter; k++){
    for(var l=0; l<n; l++){

      // Bodies participating in constraint
      var body_i = this.i[l];
      var body_j = this.j[l];

      var l12 = 12*l;
      if(!precomp[l]){
	// Precompute constants c[l] and B[l] for contact l
	var G_Minv_Gt = 0.0;
	var Gq = 0.0;
	var GW = 0.0;
	var GMinvf = 0.0;
	for(var i=0; i<12; i++){
	  var addi = l12+i;
	  G_Minv_Gt += G[addi] * this.MinvTrace[addi] * G[addi];
	  Gq +=        G[addi] * this.q[addi];
	  GW +=        G[addi] * this.qdot[addi];
	  GMinvf +=    G[addi] * this.MinvTrace[addi] * this.Fext[addi];
	}
	c[l] = 1.0 / (G_Minv_Gt + this.eps); // 1.0 / ( G*Minv*Gt + eps)
	B[l] = ( - this.a * Gq
		 - this.b * GW
		 - this.h * GMinvf);
	precomp[l] = 1;

	if(this.debug){
	  console.log("G_Minv_Gt["+l+"]:",G_Minv_Gt);
	  console.log("Gq["+l+"]:",Gq);
	  console.log("GW["+l+"]:",GW);
	  console.log("GMinvf["+l+"]:",GMinvf);
	}
      }

      var Gulambda = 0.0;
      /*
      for(var i=0; i<12; i++)
	Gulambda +=  this.G[i + l12] * ulambda[i + l12];
      */
      Gulambda += G[0+l12] * this.vxlambda[body_i]; // previuously calculated lambdas
      Gulambda += G[1+l12] * this.vylambda[body_i];
      Gulambda += G[2+l12] * this.vzlambda[body_i];
      Gulambda += G[3+l12] * this.wxlambda[body_i];
      Gulambda += G[4+l12] * this.wylambda[body_i];
      Gulambda += G[5+l12] * this.wzlambda[body_i];

      Gulambda += G[6+l12] * this.vxlambda[body_j];
      Gulambda += G[7+l12] * this.vylambda[body_j];
      Gulambda += G[8+l12] * this.vzlambda[body_j];
      Gulambda += G[9+l12] * this.wxlambda[body_j];
      Gulambda += G[10+l12] * this.wylambda[body_j];
      Gulambda += G[11+l12] * this.wzlambda[body_j];

      dlambda[l] = c[l] * ( B[l] - Gulambda - this.eps * lambda[l]);
      if(this.debug)
	console.log("dlambda["+l+"]=",dlambda[l]);
      lambda[l] = lambda[l] + dlambda[l];

      // Clamp lambda if out of bounds
      // @todo check if limits are numbers
      if(this.haslower[l] && lambda[l]<this.lower[l]){
	if(this.debug)
	  console.log("hit lower bound for constraint "+l+", truncating "+lambda[l]+" to "+this.lower[l]);
	lambda[l] = this.lower[l];
	dlambda[l] = this.lower[l]-lambda[l];
      }
      if(this.hasupper && lambda[l]>this.upper[l]){
	if(this.debug)
	  console.log("hit upper bound for constraint "+l+", truncating "+lambda[l]+" to "+this.upper[l]);
	lambda[l] = this.upper[l];
	dlambda[l] = this.upper[l]-lambda[l];
      }

      // Add velocity changes to keep track of them
      /*
      for(var i=0; i<12; i++)
	ulambda[i+l12] += dlambda[l] * this.MinvTrace[l12+i] * this.G[l12+i];
      */
      this.vxlambda[body_i] += dlambda[l] * this.MinvTrace[l12+0] * G[l12+0];
      this.vylambda[body_i] += dlambda[l] * this.MinvTrace[l12+1] * G[l12+1];
      this.vzlambda[body_i] += dlambda[l] * this.MinvTrace[l12+2] * G[l12+2];
      this.wxlambda[body_i] += dlambda[l] * this.MinvTrace[l12+3] * G[l12+3];
      this.wylambda[body_i] += dlambda[l] * this.MinvTrace[l12+4] * G[l12+4];
      this.wzlambda[body_i] += dlambda[l] * this.MinvTrace[l12+5] * G[l12+5];

      this.vxlambda[body_j] += dlambda[l] * this.MinvTrace[l12+6] * G[l12+6];
      this.vylambda[body_j] += dlambda[l] * this.MinvTrace[l12+7] * G[l12+7];
      this.vzlambda[body_j] += dlambda[l] * this.MinvTrace[l12+8] * G[l12+8];
      this.wxlambda[body_j] += dlambda[l] * this.MinvTrace[l12+9] * G[l12+9];
      this.wylambda[body_j] += dlambda[l] * this.MinvTrace[l12+10] * G[l12+10];
      this.wzlambda[body_j] += dlambda[l] * this.MinvTrace[l12+11] * G[l12+11];

        /*
	ulambda_i[i+l12] += dlambda[l] * this.MinvTrace[l12+i] * this.G[l12+i];
	ulambda_j[i+l12] += dlambda[l] * this.MinvTrace[l12+i] * this.G[l12+i];
	*/
    }
  }

  if(this.debug)
    for(var l=0; l<n; l++)
      console.log("ulambda["+l+"]=",
		  ulambda[l*12+0],
		  ulambda[l*12+1],
		  ulambda[l*12+2],
		  ulambda[l*12+3],
		  ulambda[l*12+4],
		  ulambda[l*12+5],
		  ulambda[l*12+6],
		  ulambda[l*12+7],
		  ulambda[l*12+8],
		  ulambda[l*12+9],
		  ulambda[l*12+10],
		  ulambda[l*12+11]);
  this.result = ulambda;
};
/**
 * The physics world
 * @class World
 */
CANNON.World = function(){

  // Some default values
  this.paused = false;
  this.time = 0.0;
  this.stepnumber = 0;
  this.iter = 10;

  this.spook_k = 3000.0;
  this.spook_d = 3.0;

  var th = this;
  this.spook_a = function(h){ return 4.0 / (h * (1 + 4 * th.spook_d)); };
  this.spook_b = (4.0 * this.spook_d) / (1 + 4 * this.spook_d);
  this.spook_eps = function(h){ return 4.0 / (h * h * th.spook_k * (1 + 4 * th.spook_d)); };

  this.solver = new CANNON.Solver(this.spook_a(1.0/60.0),
				   this.spook_b,
				   this.spook_eps(1.0/60.0),
				   this.spook_k,
				   this.spook_d,
				   this.iter,
				   1.0/60.0);
};

/**
 * Get number of objects in the world.
 * @return int
 */
CANNON.World.prototype.togglepause = function(){
  this.paused = !this.paused;
};

/**
 * Get number of objects in the world.
 * @return int
 */
CANNON.World.prototype.numObjects = function(){
  return this.x ? this.x.length : 0;
};

/**
 * Add a rigid body to the simulation.
 * @param RigidBody body
 * @todo If the simulation has not yet started, why recrete and copy arrays for each body? Accumulate in dynamic arrays in this case.
 * @todo Adding an array of bodies should be possible. This would save some loops too
 */
CANNON.World.prototype.add = function(body){
  if(!body)
    return;

  var n = this.numObjects();

  old_x = this.x;
  old_y = this.y;
  old_z = this.z;
  
  old_vx = this.vx;
  old_vy = this.vy;
  old_vz = this.vz;
  
  old_fx = this.fx;
  old_fy = this.fy;
  old_fz = this.fz;
  
  old_taux = this.taux;
  old_tauy = this.tauy;
  old_tauz = this.tauz;
  
  old_wx = this.wx;
  old_wy = this.wy;
  old_wz = this.wz;
  
  old_qx = this.qx;
  old_qy = this.qy;
  old_qz = this.qz;
  old_qw = this.qw;

  old_type = this.type;
  old_geodata = this.geodata;
  old_body = this.body;
  old_fixed = this.fixed;
  old_invm = this.invm;
  old_mass = this.mass;
  old_inertiax = this.inertiax;
  old_inertiay = this.inertiay;
  old_inertiaz = this.inertiaz;

  this.x = new Float32Array(n+1);
  this.y = new Float32Array(n+1);
  this.z = new Float32Array(n+1);
  
  this.vx = new Float32Array(n+1);
  this.vy = new Float32Array(n+1);
  this.vz = new Float32Array(n+1);
  
  this.fx = new Float32Array(n+1);
  this.fy = new Float32Array(n+1);
  this.fz = new Float32Array(n+1);
  
  this.taux = new Float32Array(n+1);
  this.tauy = new Float32Array(n+1);
  this.tauz = new Float32Array(n+1);
  
  this.wx = new Float32Array(n+1);
  this.wy = new Float32Array(n+1);
  this.wz = new Float32Array(n+1);
  
  this.qx = new Float32Array(n+1);
  this.qy = new Float32Array(n+1);
  this.qz = new Float32Array(n+1);
  this.qw = new Float32Array(n+1);

  this.type = new Int16Array(n+1);
  this.geodata = [];
  this.body = [];
  this.fixed = new Int16Array(n+1);
  this.mass = new Float32Array(n+1);
  this.inertiax = new Float32Array(n+1);
  this.inertiay = new Float32Array(n+1);
  this.inertiaz = new Float32Array(n+1);
  this.invm = new Float32Array(n+1);
  
  // Add old data to new array
  for(var i=0; i<n; i++){
    this.x[i] = old_x[i];
    this.y[i] = old_y[i];
    this.z[i] = old_z[i];
  
    this.vx[i] = old_vx[i];
    this.vy[i] = old_vy[i];
    this.vz[i] = old_vz[i];
  
    this.fx[i] = old_fx[i];
    this.fy[i] = old_fy[i];
    this.fz[i] = old_fz[i];
  
    this.taux[i] = old_taux[i];
    this.tauy[i] = old_tauy[i];
    this.tauz[i] = old_tauz[i];
  
    this.wx[i] = old_wx[i];
    this.wy[i] = old_wy[i];
    this.wz[i] = old_wz[i];
  
    this.qx[i] = old_qx[i];
    this.qy[i] = old_qy[i];
    this.qz[i] = old_qz[i];
    this.qw[i] = old_qw[i];

    this.type[i] = old_type[i];
    this.geodata[i] = old_geodata[i];
    this.body[i] = old_body[i];
    this.fixed[i] = old_fixed[i];
    this.invm[i] = old_invm[i];
    this.mass[i] = old_mass[i];
    this.inertiax[i] = old_inertiax[i];
    this.inertiay[i] = old_inertiay[i];
    this.inertiaz[i] = old_inertiaz[i];
  }

  // Add one more
  this.x[n] = body.position.x;
  this.y[n] = body.position.y;
  this.z[n] = body.position.z;
  
  this.vx[n] = body.velocity.x;
  this.vy[n] = body.velocity.y;
  this.vz[n] = body.velocity.z;
  
  this.fx[n] = body.force.x;
  this.fy[n] = body.force.y;
  this.fz[n] = body.force.z;
  
  this.taux[n] = body.tau.x;
  this.tauy[n] = body.tau.y;
  this.tauz[n] = body.tau.z;

  this.wx[n] = body.rotvelo.x;
  this.wy[n] = body.rotvelo.y;
  this.wz[n] = body.rotvelo.z;
  
  this.qx[n] = body.quaternion.x;
  this.qy[n] = body.quaternion.y;
  this.qz[n] = body.quaternion.z;
  this.qw[n] = body.quaternion.w;

  this.type[n] = body.type;
  this.geodata[n] = body.geodata;
  this.body[n] = body; // Keep reference to body
  this.fixed[n] = body.mass<=0.0 ? 1 : 0;
  this.invm[n] = body.mass>0 ? 1.0/body.mass : 0;
  this.mass[n] = body.mass;

  this.inertiax[n] = body.inertia.x;
  this.inertiay[n] = body.inertia.y;
  this.inertiaz[n] = body.inertia.z;

  body.id = n-1; // give id as index in table
  body.world = this;

  // Create collision matrix
  this.collision_matrix = new Int16Array((n+1)*(n+1));
};

/**
 * Get/set the broadphase collision detector for the world.
 * @param BroadPhase broadphase
 * @return BroadPhase
 */
CANNON.World.prototype.broadphase = function(broadphase){
  if(broadphase){
    this._broadphase = broadphase;
  } else
    return this._broadphase;
};

/**
 * Get/set the number of iterations
 * @param int n
 * @return int
 */
CANNON.World.prototype.iterations = function(n){
  if(n)
    this.iter = parseInt(n);
  else
    return this.iter;
};

/**
 * Set the gravity
 * @param Vec3
 * @return Vec3
 */
CANNON.World.prototype.gravity = function(g){
  if(g==undefined)
    return this.gravity;
  else
    this.gravity = g;
};

/**
 * Step the simulation
 * @param float dt
 */
CANNON.World.prototype.step = function(dt){
  if(this.paused)
    return;

  // 1. Collision detection
  var pairs = this._broadphase.collisionPairs(this);
  var p1 = pairs[0];
  var p2 = pairs[1];

  // Get references to things that are accessed often. Will save some lookup time.
  var SPHERE = CANNON.RigidBody.prototype.types.SPHERE;
  var PLANE = CANNON.RigidBody.prototype.types.PLANE;
  var types = world.type;
  var x = world.x;
  var y = world.y;
  var z = world.z;
  var qx = world.qx;
  var qy = world.qy;
  var qz = world.qz;
  var qw = world.qw;
  var vx = world.vx;
  var vy = world.vy;
  var vz = world.vz;
  var wx = world.wx;
  var wy = world.wy;
  var wz = world.wz;
  var fx = world.fx;
  var fy = world.fy;
  var fz = world.fz;
  var taux = world.taux;
  var tauy = world.tauy;
  var tauz = world.tauz;

  // @todo reuse these somehow?
  var vx_lambda = new Float32Array(world.x.length);
  var vy_lambda = new Float32Array(world.y.length);
  var vz_lambda = new Float32Array(world.z.length);
  var wx_lambda = new Float32Array(world.x.length);
  var wy_lambda = new Float32Array(world.y.length);
  var wz_lambda = new Float32Array(world.z.length);

  var lambdas = new Float32Array(p1.length);
  var lambdas_t1 = new Float32Array(p1.length);
  var lambdas_t2 = new Float32Array(p1.length);
  for(var i=0; i<lambdas.length; i++){
    lambdas[i] = 0;
    lambdas_t1[i] = 0;
    lambdas_t2[i] = 0;
    vx_lambda[i] = 0;
    vy_lambda[i] = 0;
    vz_lambda[i] = 0;
    wx_lambda[i] = 0;
    wy_lambda[i] = 0;
    wz_lambda[i] = 0;
  }

  var that = this;
  function cmatrix(i,j,newval){
    if(i>j){
      var temp = j;
      j = i;
      i = temp;
    }
    if(newval===undefined)
      return that.collision_matrix[i+j*that.numObjects()];
    else {
      that.collision_matrix[i+j*that.numObjects()] = parseInt(newval);
    }
  }

  // Resolve impulses
  for(var k=0; k<p1.length; k++){
    
    // Get current collision indeces
    var i = p1[k];
    var j = p2[k];
    
    // sphere-plane impulse
    if((types[i]==SPHERE && types[j]==PLANE) ||
       (types[i]==PLANE &&  types[j]==SPHERE)){
      
      // Identify what is what
      var pi, si;
      if(types[i]==SPHERE){
	si=i;
	pi=j;
      } else {
	si=j;
	pi=i;
      }

      // @todo apply the notation at http://www8.cs.umu.se/kurser/TDBD24/VT06/lectures/Lecture6.pdf
      
      // Collision normal
      var n = world.geodata[pi].normal;
	
      // Check if penetration
      var r = new CANNON.Vec3(x[si]-x[pi],
			       y[si]-y[pi],
			       z[si]-z[pi]);
      r = n.mult(r.dot(n));
      var q = (r.dot(n)-world.geodata[si].radius);

      var w_sphere = new CANNON.Vec3(wx[si], wy[si], wz[si]);
      var v_sphere = new CANNON.Vec3(vx[si], vy[si], vz[si]);
      // Contact velocity
      // v = (body(n).V(1:3) + cr(body(n).V(4:6)',rn)') - (body(m).V(1:3) + cr(body(m).V(4:6)',rm)'); % m is plane
      // @todo

      var v_contact = v_sphere.vadd(r.cross(w_sphere));

      //var v_contact = new CANNON.Vec3(vx[si]+cr.x,
      //vy[si]+cr.y,
      //vz[si]+cr.z);
     
      //v_sphere.vadd(w_sphere.cross(r),v_contact);

      // Relative velocity
      var u = n.mult(v_sphere.dot(n));
      
      // Action if penetration
      if(q<=0.0 && cmatrix(si,pi)==0){ // No impact for separating contacts
	if(u.dot(n)<0.0)
	  cmatrix(si,pi,1);
	var r_star = r.crossmat();
	var invm = this.invm;

	// Collision matrix:
	// K = eye(3,3)/body(n).m - r_star*body(n).Iinv*r_star;
	var K = new CANNON.Mat3();
	K.identity();
	K.elements[0] *= invm[si];
	K.elements[4] *= invm[si];
	K.elements[8] *= invm[si];

	var rIr = r_star.mmult(K.mmult(r_star));
	for(var el = 0; el<9; el++)
	  K.elements[el] -= rIr.elements[el];
	
	// First assume stick friction
	var e = 0.5;

	// Final velocity if stick
	var v_f = n.mult(-e * (v_contact.dot(n))); 

	var impulse_vec =  K.solve(v_f.vsub(v_contact));
	
	// Check if slide mode (J_t > J_n) - outside friction cone
	var mu = 0.3; // quick fix
	if(mu>0){
	  var J_n = n.mult(impulse_vec.dot(n));
	  var J_t = impulse_vec.vsub(J_n);
	  if(J_t.norm() > J_n.mult(mu).norm()){
	    var v_tang = v_sphere.vsub(n.mult(v_sphere.dot(n)));
	    var tangent = v_tang.mult(1/(v_tang.norm() + 0.0001));
	    var impulse = -(1+e)*(v_sphere.dot(n))/(n.dot(K.vmult((n.vsub(tangent.mult(mu))))));
	    impulse_vec = n.mult(impulse).vsub(tangent.mult(mu * impulse));
	  }
	}

	// Add to velocity
	// todo: add to angular velocity as below
	var add = impulse_vec.mult(invm[si]);
	vx[si] += add.x;
	vy[si] += add.y;
	vz[si] += add.z;

	var cr = impulse_vec.cross(r);
	var wadd = cr.mult(1.0/world.inertiax[si]);

	wx[si] += wadd.x; //body(n).V(4:6) = body(n).V(4:6) + (body(n).Iinv*cr(impulse_vec,r))';
	wy[si] += wadd.y;
	wz[si] += wadd.z;
	
	cmatrix(si,pi,-1); // Just applied impulse - set impact
      } else if(q<=0 & cmatrix(si,pi)==-1)
	cmatrix(si,pi,1); // Last step was impact and we are still penetrated- set contact
      else if(q>0)
	cmatrix(si,pi,0); // No penetration any more- set no contact

      // Sphere-sphere impulse
    } else if(types[i]==SPHERE && types[j]==SPHERE){

      var n = new CANNON.Vec3(x[i]-x[j],
			       y[i]-y[j],
			       z[i]-z[j]);
      var nlen = n.norm();
      n.normalize();
      var q = (nlen - (world.geodata[i].radius+world.geodata[j].radius));
      var u = new CANNON.Vec3(vx[i]-vx[j],
			       vy[i]-vy[j],
			       vz[i]-vz[j]);
      u = n.mult(u.dot(n));
      if(q<0.0 && u.dot(n)<0){
	var e = 0.5;
	var u_new = n.mult(-(u.dot(n)*e));
	
	vx[i] += e*(u_new.x - u.x)*world.invm[j];
	vy[i] += e*(u_new.y - u.y)*world.invm[j];
	vz[i] += e*(u_new.z - u.z)*world.invm[j];

	vx[j] -= e*(u_new.x - u.x)*world.invm[i];
	vy[j] -= e*(u_new.y - u.y)*world.invm[i];
	vz[j] -= e*(u_new.z - u.z)*world.invm[i];

	// Todo, implement below things. They are general impulses from granular.m
	var r = new CANNON.Vec3(x[i]-x[j],
				 y[i]-y[j],
				 z[i]-z[j]);
	var ri = n.mult(world.geodata[i].radius);
	var rj = n.mult(world.geodata[j].radius);

	//            % Collide with core
	//                r = dR;
	//                rn = -body(n).r_core * normal;
	//                rm = body(m).r_core * normal;
	//                v = (body(n).V(1:3) + cr(body(n).V(4:6)',rn)') - (body(m).V(1:3) + cr(body(m).V(4:6)',rm)');
	//                if v*r > 0 
	//                    COLLISION_MATRIX(n,m) = 1;
	//                    break                                                  % No impact for separating contacts
	//                end
	//                r_star = getSTAR2(r);
	//                rn_star = getSTAR2(rn);
	//                rm_star = getSTAR2(rm);

	var r_star = r.crossmat();
	var ri_star = ri.crossmat();
	var rj_star = rj.crossmat();

	//K = eye(3,3)/body(n).m + eye(3,3)/body(m).m - rn_star*body(m).Iinv*rn_star - rm_star*body(n).Iinv*rm_star; 
	//                % First assume stick friction
	//                v_f = - e_pair * (v*normal) * normal';               % Final velocity if stick
	//                impulse_vec =  K\(v_f - v)';
	//                % Check if slide mode (J_t > J_n) - outside friction cone
	//                if MU>0
	//                    J_n = (impulse_vec'*normal) * normal;
	//                    J_t = impulse_vec - J_n;
	//                    if norm(J_t) > norm(MU*J_n)                    
	//                            v_tang = v' - (v*normal)*normal;
	//                            tangent =  v_tang/(norm(v_tang) + 10^(-6));
	//                            impulse = -(1+e_pair)*(v*normal)/(normal' * K * (normal - MU*tangent));
	//                            impulse_vec = impulse * normal - MU * impulse * tangent;
	//                    end
	//                end
	//                 bodyTotmass = body(n).m + body(m).m;
	//                 body(n).V(1:3) = body(n).V(1:3) +  1/body(n).m * impulse_vec';
	//                 body(n).V(4:6) = body(n).V(4:6) + (body(n).Iinv*cr(impulse_vec,rn))';
	//                 %body(n).x(1:3) = body(n).x(1:3) + penetration*normal * (body(n).m/bodyTotmass);
	//                 body(n).L = body(n).I*body(n).V(4:6)';
	//                 body(m).V(1:3) = body(m).V(1:3) -  1/body(m).m * impulse_vec';
	//                 body(m).V(4:6) = body(m).V(4:6) + (body(m).Iinv*cr(impulse_vec,rm))';
	//                 %body(m).x(1:3) = body(m).x(1:3) - penetration*normal * (body(m).m/bodyTotmass);
	//                 body(m).L = body(m).I*body(m).V(4:6)';


      }
    }
  } // End of impulse solve

  /*
  // Iterate over contacts
  for(var l=0; l<this.iterations(); l++){
  for(var k=0; k<p1.length; k++){

  // Get current collision indeces
  var i = p1[k];
  var j = p2[k];
      
  // sphere-plane collision
  if((types[i]==SPHERE &&
  types[j]==PLANE) ||
  (types[i]==PLANE &&
  types[j]==SPHERE)){
	
  // Identify what is what
  var pi, si;
  if(types[i]==SPHERE){
  si=i;
  pi=j;
  } else {
  si=j;
  pi=i;
  }
	
  // Collision normal
  var n = world.geodata[pi].normal;
	
  // Check if penetration
  var r = new CANNON.Vec3(x[si]-x[pi],
  y[si]-y[pi],
  z[si]-z[pi]);
  var q = (r.dot(n)-world.geodata[si].radius)*2;
  var v_sphere = new CANNON.Vec3(vx[si],
  vy[si],
  vz[si]);
	
  var u = n.mult(v_sphere.dot(n));
	
  // Action if penetration
  if(q<0.0){

  var old_lambda = lambdas[k];
  var fs = new CANNON.Vec3(fx[si],
  fy[si],
  fz[si]);
  var new_deltalambda = (- q*world.spook_a(dt)
  - u.dot(n)*world.spook_b
  - (fs.dot(n)*world.invm[si])*dt
  - old_lambda*world.spook_eps(dt))/(world.invm[si]
  + 1/(world.mass[si]*Math.pow(world.geodata[si].radius,2.0/5.0))
  + world.spook_eps(dt));
	  
  var new_lambda = new_deltalambda - old_lambda; // + ?
	
  // Check sign of lambdas and fix
  if(new_lambda<0){
  new_deltalambda = -new_lambda;
  new_lambda = 0;
  }
	  
  // save for next timestep
  lambdas[k] = new_lambda;
	  
  // Accumulate velocities
  vx_lambda[si] += n.x * new_deltalambda * world.invm[si];
  vy_lambda[si] += n.y * new_deltalambda * world.invm[si];
  vz_lambda[si] += n.z * new_deltalambda * world.invm[si];
	  
  // --- Friction constraint ---
  // First assume stick friction
  var old_lambda_t1 = lambdas_t1[k];
  var old_lambda_t2 = lambdas_t2[k];
	  
  // Construct tangents
  var t1 = new CANNON.Vec3();
  var t2 = new CANNON.Vec3();
  n.tangents(t1,t2);

	  
  }
  } else if(types[i]==SPHERE &&
  types[j]==SPHERE){
  var r = new CANNON.Vec3(x[i]-x[j],
  y[i]-y[j],
  z[i]-z[j]);
  var nlen = r.norm();
  var n = new CANNON.Vec3(x[i]-x[j],
  y[i]-y[j],
  z[i]-z[j]);
  n.normalize();
  var q = (nlen - (world.geodata[i].radius+world.geodata[j].radius))*2;
  var u = new CANNON.Vec3(vx[i]-vx[j],
  vy[i]-vy[j],
  vz[i]-vz[j]);
  u = n.mult(u.dot(n));
  if(q<0.0){

  // Solve for lambda
  var old_lambda = lambdas[k];
  var fi = new CANNON.Vec3(fx[i],
  fy[i],
  fz[i]);
  var fj = new CANNON.Vec3(fx[j],
  fy[j],
  fz[j]);
  var new_deltalambda = (- q*world.spook_a(dt)
  - u.dot(n)*world.spook_b
  - (fi.dot(n)*world.invm[i] + fj.dot(n)*world.invm[j])*dt
  - old_lambda*world.spook_eps(dt))/(world.invm[i]
  + world.invm[j]
  + world.spook_eps(dt));
	
  var new_lambda = new_deltalambda - old_lambda;
	
  // Check sign of lambdas and fix
  if(new_lambda < 0.0){
  new_deltalambda = - new_lambda;
  new_lambda = 0;
  }
	
  // save for next timestep
  lambdas[k] = new_lambda;
	
  // Accumulate velocities
  vx_lambda[i] += n.x * new_deltalambda * world.invm[i];
  vy_lambda[i] += n.y * new_deltalambda * world.invm[i];
  vz_lambda[i] += n.z * new_deltalambda * world.invm[i];
  vx_lambda[j] -= n.x * new_deltalambda * world.invm[j];
  vy_lambda[j] -= n.y * new_deltalambda * world.invm[j];
  vz_lambda[j] -= n.z * new_deltalambda * world.invm[j];

  // Accumulate rotational velocities
  // I.inv() is just the mass for spheres
  // w_lambda[ij] = w_lambda[ij] +- I[ij].inv() * dlambda * (r x n)
  var rxn = r.cross(n);
  var Iinvi = world.mass[i];
  var Iinvj = world.mass[j];
	  
  wx_lambda[i] += Iinvi * new_deltalambda * rxn.x;
  wy_lambda[i] += Iinvi * new_deltalambda * rxn.y;
  wz_lambda[i] += Iinvi * new_deltalambda * rxn.z;
  wx_lambda[j] -= Iinvj * new_deltalambda * rxn.x;
  wy_lambda[j] -= Iinvj * new_deltalambda * rxn.y;
  wz_lambda[j] -= Iinvj * new_deltalambda * rxn.z;
  }
  }
  }
  }
  */

  // Add gravity to all objects
  for(var i=0; i<world.numObjects(); i++){
    fx[i] += world.gravity.x * world.mass[i];
    fy[i] += world.gravity.y * world.mass[i];
    fz[i] += world.gravity.z * world.mass[i];
  }

  // --- Testing new solver ---
  this.solver.reset(world.numObjects());
  var cid = new Int16Array(p1.length); // For saving constraint refs
  for(var k=0; k<p1.length; k++){

    // Get current collision indeces
    var i = p1[k];
    var j = p2[k];
      
    // sphere-plane collision
    if((types[i]==SPHERE && types[j]==PLANE) ||
       (types[i]==PLANE  && types[j]==SPHERE)){
      // Identify what is what
      var pi, si;
      if(types[i]==SPHERE){
	si=i;
	pi=j;
      } else {
	si=j;
	pi=i;
      }
      
      // Collision normal
      var n = new CANNON.Vec3(world.geodata[pi].normal.x,
			      world.geodata[pi].normal.y,
			      world.geodata[pi].normal.z);
      n.negate(n); // We are working with the sphere as body i!

      // Vector from sphere center to contact point
      var rsi = n.mult(world.geodata[si].radius);
      var rsixn = rsi.cross(n);

      // Project down shpere on plane???
      var point_on_plane_to_sphere = new CANNON.Vec3(x[si]-x[pi],
						      y[si]-y[pi],
						      z[si]-z[pi]);
      var xs = new CANNON.Vec3((x[si]),
				(y[si]),
				(z[si]));
      var plane_to_sphere = n.mult(n.dot(point_on_plane_to_sphere));
      var xp = xs.vsub(plane_to_sphere);

      // Pseudo name si := i
      // g = ( xj + rj - xi - ri ) .dot ( ni )
      // xj is in this case the penetration point on the plane, and rj=0
      var qvec = new CANNON.Vec3(xp.x - x[si] - rsi.x,
				  xp.y - y[si] - rsi.y,
				  xp.z - z[si] - rsi.z);
      var q = qvec.dot(n);
      /*
	var q = (world.geodata[si].radius - r.norm());
	var qvec = n.mult(q);
      */
      var v_sphere = new CANNON.Vec3(vx[si],vy[si],vz[si]);
      var w_sphere = new CANNON.Vec3(wx[si],wy[si],wz[si]);
      var v_contact = w_sphere.cross(rsi);
      var u = v_sphere.vadd(w_sphere.cross(rsi));
	
      // Action if penetration
      if(q<0.0){
	var iM = world.invm[si];
	var iI = world.inertiax[si] > 0 ? 1.0/world.inertiax[si] : 0; // Sphere - same for all dims
	//console.log("sphere-plane");
	cid[k] = this.solver
	  .addConstraint( // Non-penetration constraint jacobian
			 [-n.x,-n.y,-n.z,
			  0,0,0,
			  0,0,0,
			  0,0,0],
			 
			 // Inverse mass matrix
			 [iM,iM,iM,
			  iI,iI,iI,
			  0,0,0,   // Static plane -> infinite mass
			  0,0,0],
			 
			 // q - constraint violation
			 [-qvec.x,-qvec.y,-qvec.z,
			  0,0,0,
			  0,0,0,
			  0,0,0],
			 
			 // qdot - motion along penetration normal
			 [v_sphere.x, v_sphere.y, v_sphere.z,
			  0,0,0,
			  0,0,0,
			  0,0,0],
			 /*
			   [vx[si],vy[si],vz[si],
			   wx[si],wy[si],wz[si],
			   0,0,0,
			   0,0,0],*/
			 
			 // External force - forces & torques
			 [fx[si],fy[si],fz[si],
			  taux[si],tauy[si],tauz[si],
			  fx[pi],fy[pi],fz[pi],
			  taux[pi],tauy[pi],tauz[pi]],
			 0,
			 'inf',
			 si,
			 pi);
      }
    } else if(types[i]==SPHERE &&
	      types[j]==SPHERE){

      // Penetration constraint:
      var ri = new CANNON.Vec3(x[j]-x[i],
				y[j]-y[i],
				z[j]-z[i]);
      var r = new CANNON.Vec3(x[i]-x[j],
			       y[i]-y[j],
			       z[i]-z[j]);
      var nlen = r.norm();
      ri.normalize();
      ri.mult(world.geodata[i].radius,ri);
      var rj = new CANNON.Vec3(x[i]-x[j],
				y[i]-y[j],
				z[i]-z[j]);
      rj.normalize();
      rj.mult(world.geodata[j].radius,rj);
      var ni = new CANNON.Vec3(x[j]-x[i],
				y[j]-y[i],
				z[j]-z[i]);
      ni.normalize();
      // g = ( xj + rj - xi - ri ) .dot ( ni )
      var q_vec = new CANNON.Vec3(x[j]+rj.x-x[i]-ri.x,
				   y[j]+rj.y-y[i]-ri.y,
				   z[j]+rj.z-z[i]-ri.z);
      var q = q_vec.dot(ni);

      // Sphere contact!
      if(q<0.0){ // Violation always < 0

	// gdot = ( vj + wj x rj - vi - wi x ri ) .dot ( ni )
	// => W = ( vj + wj x rj - vi - wi x ri )
	var v_sphere_i = new CANNON.Vec3(vx[i],vy[i],vz[i]);
	var v_sphere_j = new CANNON.Vec3(vx[j],vy[j],vz[j]);
	var w_sphere_i = new CANNON.Vec3(wx[i],wy[i],wz[i]);
	var w_sphere_j = new CANNON.Vec3(wx[j],wy[j],wz[j]);
	v_sphere_i.vadd(w_sphere_i.cross(ri));
	v_sphere_j.vadd(w_sphere_j.cross(rj));
	
	var u = v_sphere_j.vsub(v_sphere_i);

	var fi = new CANNON.Vec3(fx[i],
				  fy[i],
				  fz[i]);
	var fj = new CANNON.Vec3(fx[j],
				  fy[j],
				  fz[j]);

	var iM_i = !world.fixed[i] ? world.invm[i] : 0;
	var iI_i = !world.fixed[i] ? 1.0/world.inertiax[i] : 0;
	var iM_j = !world.fixed[j] ? world.invm[j] : 0;
	var iI_j = !world.fixed[j] ? 1.0/world.inertiax[j] : 0;
	var rxni = r.cross(ni);

	rxni.normalize();
	//console.log("sphere-sphere...");
	cid[k] = this.solver
	  .addConstraint( // Non-penetration constraint jacobian
			 [-ni.x,   -ni.y,   -ni.z,
			  0,0,0,//-rxni.x, -rxni.y, -rxni.z,
			  ni.x,   ni.y,    ni.z,
			  0,0,0],//rxni.x, rxni.y,  rxni.z],
			 
			 // Inverse mass matrix
			 [iM_i, iM_i, iM_i,
			  iI_i, iI_i, iI_i,
			  iM_j, iM_j, iM_j,
			  iI_j, iI_j, iI_j],
			 
			 // q - constraint violation
			 [-q_vec.x,-q_vec.y,-q_vec.z,
			  0,0,0,
			  q_vec.x,q_vec.y,q_vec.z,
			  0,0,0],
			 
			 // qdot - motion along penetration normal
			 /*			 [-u.x,-u.y,-u.z,
						 0,0,0,
						 u.x,u.y,u.z,
						 0,0,0],*/
			 [vx[i],vy[i],vz[i],
			  wx[i],wy[i],wz[i],
			  vx[j],vy[j],vz[j],
			  wx[j],wy[j],wz[j]],
			 
			 // External force - forces & torques
			 [fx[i],fy[i],fz[i],
			  taux[i],tauy[i],tauz[i],
			  fx[j],fy[j],fz[j],
			  taux[j],tauy[j],tauz[j]],
			 0,
			 'inf',
			 i,
			 j);
      }
    }
  }

  if(this.solver.n){
    this.solver.solve();
    //world.togglepause();

    // Apply constraint velocities
    /*
      for(var l=0; l<this.solver.n; l++){
      var i = p1[l];
      var j = p2[l];
      if(!world.fixed[i]){
      vx[i] += this.solver.result[0+cid[l]*12];
      vy[i] += this.solver.result[1+cid[l]*12];
      vz[i] += this.solver.result[2+cid[l]*12];
      wx[i] += this.solver.result[3+cid[l]*12];
      wy[i] += this.solver.result[4+cid[l]*12];
      wz[i] += this.solver.result[5+cid[l]*12];
      }

      if(!world.fixed[j]){
      vx[j] += this.solver.result[6+cid[l]*12];
      vy[j] += this.solver.result[7+cid[l]*12];
      vz[j] += this.solver.result[8+cid[l]*12];
      wx[j] += this.solver.result[9+cid[l]*12];
      wy[j] += this.solver.result[10+cid[l]*12];
      wz[j] += this.solver.result[11+cid[l]*12];
      }
      }*/
    for(var i=0; i<world.numObjects(); i++){
      vx[i] += this.solver.vxlambda[i];
      vy[i] += this.solver.vylambda[i];
      vz[i] += this.solver.vzlambda[i];
      wx[i] += this.solver.wxlambda[i];
      wy[i] += this.solver.wylambda[i];
      wz[i] += this.solver.wzlambda[i];
    }
  }

  /*
    if(this.solver.n)
    this.solver.solve();
    if(this.solver.result){
    console.log("v_lambda",vx_lambda,vy_lambda,vz_lambda);
    console.log("new v_lambda:",this.solver.result);
    this.togglepause();
    }
  */
  // --- End of new solver test ---

  // Leap frog
  // vnew = v + h*f/m
  // xnew = x + h*vnew
  for(var i=0; i<world.numObjects(); i++){
    if(!world.fixed[i]){
      vx[i] += fx[i] * world.invm[i] * dt;// + vx_lambda[i];
      vy[i] += fy[i] * world.invm[i] * dt;// + vy_lambda[i];
      vz[i] += fz[i] * world.invm[i] * dt;// + vz_lambda[i];

      wx[i] += taux[i] * 1.0/world.inertiax[i] * dt;// + wx_lambda[i];
      wy[i] += tauy[i] * 1.0/world.inertiay[i] * dt;// + wy_lambda[i];
      wz[i] += tauz[i] * 1.0/world.inertiaz[i] * dt;// + wz_lambda[i];

      // Use new velocity  - leap frog
      x[i] += vx[i] * dt;
      y[i] += vy[i] * dt;
      z[i] += vz[i] * dt;
      
      var q = new CANNON.Quaternion(qx[i],qy[i],qz[i],qw[i]);
      var w = new CANNON.Quaternion(wx[i],wy[i],wz[i],0);
      var wq = w.mult(q);
      
      qx[i] += dt * 0.5 * wq.x;
      qy[i] += dt * 0.5 * wq.y;
      qz[i] += dt * 0.5 * wq.z;
      qw[i] += dt * 0.5 * wq.w;
      
      q.x = qx[i];
      q.y = qy[i];
      q.z = qz[i];
      q.w = qw[i];
      q.normalize();
      qx[i]=q.x;
      qy[i]=q.y;
      qz[i]=q.z;
      qw[i]=q.w;
    }
  }

  // Reset all forces
  for(var i = 0; i<world.numObjects(); i++){
    fx[i] = 0.0;
    fy[i] = 0.0;
    fz[i] = 0.0;
    taux[i] = 0.0;
    tauy[i] = 0.0;
    tauz[i] = 0.0;
  }

  // Update world time
  world.time += dt;
  world.stepnumber += 1;

  // Read all data into object references again
  for(var i=0; i<world.numObjects(); i++){
    world.body[i].position.x = x[i];
    world.body[i].position.y = y[i];
    world.body[i].position.z = z[i];

    world.body[i].velocity.x = vx[i];
    world.body[i].velocity.y = vy[i];
    world.body[i].velocity.z = vz[i];

    world.body[i].rotvelo.x = wx[i];
    world.body[i].rotvelo.y = wy[i];
    world.body[i].rotvelo.z = wz[i];

    world.body[i].quaternion.x = qx[i];
    world.body[i].quaternion.y = qy[i];
    world.body[i].quaternion.z = qz[i];
    world.body[i].quaternion.w = qw[i];
  }  
};
