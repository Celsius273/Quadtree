/*

QuadTree test
By: Kelvin Jiang

A quadtree is a data structure that contains a list of objects that are geometrically in the tree
If there are too many objects in a quadtree's list, the quadtree "splits" into 4 and all the objects are then reinserted
This decreases the time complexity taken for collision detection (which is O(n^2) for a single list) by only having to return a list of objects that are likely to collide with a single one.

Basically: if 2 objects are in different quadtree nodes, we know that they won't collide

The only weakness of this data structure is the fact that if 2 objects are in different quadtrees but their areas overlap, the algorithm fails unless we explicitly check for geometric properties when we insert into a quadtree

*/

var CIRCLE_SIZE = 4;
var CIRCLE_COUNT = 0;
var MAX_LEVEL = 9; //The maximum number of time we can, say, split our quadtree
var MAX_OBJECTS = 6; //The maximum number of objects within a quadtree
var CANVAS_SIZE = 640;

var HIT_COLOR = "#f00"; 
var TREE_COLOR = "#fa0";

function getRandomColor(start, end) { // function that returns a hex string for a random color, randomized color values are configurable to an extent
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[start+Math.floor(Math.random() * (end-start))];
    }
    return color;
}

function Circle(x, y, radius, id) //A basic circle struct
{
	this.x=x;
	this.y=y;
	this.radius = radius;

	this.xv = Math.floor(Math.random() * 8) - 4;
	this.yv = Math.floor(Math.random() * 8) - 4;

	this.color = getRandomColor(12, 16);
	this.intersect = false;

	this.id = id;
}

function distance(x1, y1, x2, y2)
{
	var a = Math.pow((y2-y1), 2);
	var b = Math.pow((x2-x1), 2);
	return Math.pow((a+b), 0.5);
}


function QuadTree(x, y, length, level) //Assume square quadtree and square canvases for this simulator
{
	this.x=x;
	this.y=y;
	this.length=length;

	this.level = level;
	this.nodes = [null,null,null,null];

	this.objects = [];
}

QuadTree.prototype.clear = function(){
	this.objects = [];

	for (var i=0; i<this.nodes.length; i++)
	{
		if (this.nodes[i] != null)
		{
			this.nodes[i].clear();
			this.nodes[i] = null;
		}
	}

}

QuadTree.prototype.split = function(){
	var halfLength = Math.round((this.length)/2.0);

	this.nodes[0] = new QuadTree(this.x, this.y, halfLength, this.level+1);
	this.nodes[1] = new QuadTree(this.x+halfLength, this.y, halfLength, this.level+1);
	this.nodes[2] = new QuadTree(this.x, this.y+halfLength, halfLength, this.level+1);
	this.nodes[3] = new QuadTree(this.x+halfLength, this.y+halfLength, halfLength, this.level+1);
}

QuadTree.prototype.getIndex = function(circle){ //so far, only works if the circle's CENTER is fully in a node, radius calculations are not considered at this point
	var index = -1;
	var halfLength = Math.round((this.length)/2.0);
	
	var leftHalf =   (circle.x >= this.x && circle.x <= (this.x + halfLength));
	var rightHalf =  (circle.x > (this.x + halfLength) && circle.x <= (this.x + this.length));

	var topHalf  =   (circle.y >= this.y && circle.y <= (this.y + halfLength));
	var bottomHalf = (circle.y > (this.y + halfLength) && circle.y <= (this.y + this.length));

	if (topHalf == true){
		if (leftHalf == true){
			index = 0;
		}else if (rightHalf == true){
			index = 1;
		}
	}else if (bottomHalf == true){
		if (leftHalf == true){
			index = 2;
		}else if (rightHalf == true){
			index = 3;
		}
	}
	return index;
}

QuadTree.prototype.insert = function(circle){
	if (this.nodes[0] != null){
		var index = this.getIndex(circle);

		if (index != -1){
			this.nodes[index].insert(circle);
			return;
		}
	}

	this.objects[this.objects.length] = circle;

	if (this.objects.length > MAX_OBJECTS && this.level < MAX_LEVEL)
	{
		if (this.nodes[0] == null){
			this.split();
		}
		var i=0;
		while (i<this.objects.length)
		{
			var midIndex = this.getIndex (this.objects[i]);
			if (midIndex != -1){
				this.nodes[midIndex].insert(this.objects[i]);
				this.objects.splice(i, 1); //remove the current item from this quadtree's object list if it is to be inserted into a subtree
			}
			else{
				i++;
			}
		}
	}
}

// retrieves the objects that are determined to be likely to collide with a given circle aka all circles within the current node of the circle
QuadTree.prototype.retrieve = function(returnObjects, circle) {
	var index = this.getIndex(circle);
	if (index != -1 && this.nodes[0] != null) {
   		return this.nodes[index].retrieve(returnObjects, circle);
	}
 
 	for (var i=0;i<this.objects.length; i++) {
		returnObjects[returnObjects.length] = this.objects[i];
 	}
	return returnObjects;
}

// rendering method for the quadtree object itself
QuadTree.prototype.drawTree = function(context){
	var midLength = Math.round(this.length/2);
	var qLength = Math.round(midLength/2);
	
	context.beginPath();
	context.strokeStyle = TREE_COLOR;
	context.rect(this.x, this.y, this.length, this.length);	
	context.stroke();
	context.closePath();	
	for (var i=0; i<this.nodes.length; i++)
	{
		if (this.nodes[i] != null){
			this.nodes[i].drawTree(context);
		}
	}
}

var circles = []; //list of all circles currently on the screen
var quad = new QuadTree(0, 0, CANVAS_SIZE, 1); //singleton instance of QuadTree to be used in this simulator

function action()
{
	quad.clear(); //clear EVERYTHING
	for (var i=0; i<circles.length; i++) {
		quad.insert(circles[i]);
	}

	var relevant=[];

	for (var i=0; i<circles.length; i++) {
		relevant = [];
		quad.retrieve(relevant, circles[i]);
		circles[i].intersect = false;
		for (var j=0; j<relevant.length; j++) {

			// check collisions between all circles, making sure that they do not have the same ID (to prevent self-intersection) and the distance between their centers are less than the sum of their radii
			if ( (circles[i].id != relevant[j].id) && (distance(circles[i].x, circles[i].y, relevant[j].x, relevant[j].y) <= (circles[i].radius+relevant[j].radius)) ) {
				circles[i].intersect = true;
			}
		}
	}
}

function move()
{
	for (var i=0; i< circles.length; i++)
	{
		circles[i].x+=circles[i].xv;
		circles[i].y+=circles[i].yv;

		if (circles[i].x > (CANVAS_SIZE-circles[i].radius) || circles[i].x < circles[i].radius){
			circles[i].xv = -circles[i].xv;
		}
		if (circles[i].y > (CANVAS_SIZE-circles[i].radius) || circles[i].y < circles[i].radius){
			circles[i].yv = -circles[i].yv;
		}
	}
}

var fps = {
	startTime : 0,
	frameNumber : 0,
	getFPS : function(){
		this.frameNumber++;
		var d = new Date().getTime(),
			currentTime = ( d - this.startTime ) / 1000,
			result = Math.floor( ( this.frameNumber / currentTime ) );

		if( currentTime > 1 ){
			this.startTime = new Date().getTime();
			this.frameNumber = 0;
		}
		return result;
	}	
};

function draw()
{
	var context = document.getElementById('mainCanvas').getContext('2d');
	context.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
	action();
	move();

	quad.drawTree(context);

	for (var i=0; i< circles.length; i++)
	{
		context.beginPath();
		context.fillStyle = circles[i].color;
		if (circles[i].intersect == false)
		{
			context.fillStyle = circles[i].color;
		}else{
			context.fillStyle = HIT_COLOR;
		}
		context.arc(circles[i].x, circles[i].y, circles[i].radius, 0, 2 * Math.PI, false);
		context.fill();
		context.closePath();

	}

	$(".counter").html(fps.getFPS());
}

$(document).ready(function() {
	$(document.getElementById('mainCanvas')).click(function(e){
		var element = document.getElementById('QuadTree');

		var circlesToAdd = 1;
		switch (e.which) {
        	case 2:
        		circlesToAdd = 100; // to quickly populate the canvas
				break;
			default:

    	}	

		for (var i=0; i < circlesToAdd; i++){
			circles[circles.length] = new Circle(e.clientX - element.offsetLeft, e.clientY - element.offsetTop, CIRCLE_SIZE, CIRCLE_COUNT);
			CIRCLE_COUNT++;
			$(".numCircles").html(CIRCLE_COUNT);
			quad.insert(circles[circles.length-1]);
		}
		
	});
});
setInterval(draw, 15);

