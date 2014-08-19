/*

QuadTree test
By: Kelvin Jiang

A quadtree is a data structure that contains a list of objects that are geometrically in the tree
If there are too many objects in a quadtree's list, the quadtree "splits" into 4 and all the objects are then reinserted
This decreases the time complexity taken for collision detection (which is O(n^2) for a single list) by only having to return a list of objects that are likely to collide with a single one.

Basically: if 2 objects are in different quadtree nodes, we know that they won't collide

The only weakness of this data structure is the fact that if 2 objects are in different quadtrees but their areas overlap, the algorithm fails unless we explicitly check for geometric properties when we insert into a quadtree

*/
function getRandomColor(start, end) {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[start+Math.floor(Math.random() * (end-start))];
    }
    return color;
}

function Circle(x, y, radius, id)
{
	this.x=x;
	this.y=y;
	this.radius = radius;

	this.xv = Math.floor(Math.random() * 8) - 4;
	this.yv = Math.floor(Math.random() * 8) - 4;

	//this.xv = 0
	//this.yv = 0

	this.color = getRandomColor(12, 16);
	this.intersect = false;

	this.id = id;
}

function distance(x1, y1, x2, y2)
{
	var a = Math.pow((y2-y1), 2);
	var b = Math.pow((x2-x1), 2);

	var c = Math.pow((a+b), 0.5);
	return c;
}

var maxLevel = 6; //The maximum number of time we can, say, split our quadtree
var maxObjects = 4; //The maximum number of objects within a quadtree
function QuadTree(x, y, length, level) //Assume square quadtree and square canvases
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
	var halfLength = Math.round((this.length + 0.0)/2);

	this.nodes[0] = new QuadTree(this.x, this.y, halfLength, this.level+1);
	this.nodes[1] = new QuadTree(this.x+halfLength, this.y, halfLength, this.level+1);
	this.nodes[2] = new QuadTree(this.x, this.y+halfLength, halfLength, this.level+1);
	this.nodes[3] = new QuadTree(this.x+halfLength, this.y+halfLength, halfLength, this.level+1);

}

QuadTree.prototype.getIndex = function(circle){ //so far, only works if the circle's CENTER is fully in a node, radius calculations are not considered at this point
	var index = -1;
	var halfLength = Math.round((this.length + 0.0)/2);
	var leftHalf = (circle.x >= this.x && circle.x <= (this.x + halfLength));
	var topHalf  = (circle.y >= this.y && circle.y <= (this.y + halfLength));

	if (topHalf == true){
		if (leftHalf == true){
			index = 0;
		}else{
			index = 1;
		}
	}else{
		if (leftHalf == true){
			index = 2;
		}else{
			index = 3;
		}
	}
	return index;
}

QuadTree.prototype.insert = function(circle){
	if (this.nodes[0] != null)
	{
		var index = this.getIndex(circle);

		if (index != -1)
		{
			this.nodes[index].insert(circle);
			return;
		}
	}

	this.objects[this.objects.length] = circle;

	if (this.objects.length > maxObjects && this.level < maxLevel)
	{
		if (this.nodes[0] == null)
		{
			this.split();
		}
		var i=0;
		while (i<this.objects.length)
		{
			var midIndex = this.getIndex (this.objects[i]);
			if (midIndex != -1)
			{
				this.nodes[midIndex].insert(this.objects[i]);
				this.objects.splice(i, 1);
			}
			else{
				i++;
			}
		}
	}
}


QuadTree.prototype.retrieve = function(returnObjects, circle) {
	var index = this.getIndex(circle);
	if (index != -1 && this.nodes[0] != null) {
   		this.nodes[index].retrieve(returnObjects, circle);
	}
 
 	for (var i=0;i<this.objects.length; i++)
 	{
		returnObjects[returnObjects.length] = this.objects[i];
 	}
	return returnObjects;
}

QuadTree.prototype.drawTree = function(context){
	var midLength = Math.round(this.length/2);
	var qLength = Math.round(midLength/2);
	

	context.beginPath();
	context.strokeStyle = "#FFAA00";
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
var circles = [];
var mx = 0;
var my = 0;
var lol;

var quad = new QuadTree(0, 0, 640, 1);

function action()
{
	quad.clear(); //clear EVERYTHING
	for (var i=0; i<circles.length; i++)
	{
		quad.insert(circles[i]);
	}

	var relevant=[];

	for (var i=0; i<circles.length; i++)
	{
		relevant=[];
		quad.retrieve(relevant, circles[i]);
		circles[i].intersect = false;
		for (var j=0; j<relevant.length; j++)
		{
			if ( (circles[i].id != relevant[j].id) && (distance(circles[i].x, circles[i].y, relevant[j].x, relevant[j].y) <= (circles[i].radius+relevant[j].radius)) )
			{
				circles[i].intersect = true;
			}
		}

		relevant = [];
	}
}

function move()
{
	for (var i=0; i< circles.length; i++)
	{
		circles[i].x+=circles[i].xv;
		circles[i].y+=circles[i].yv;

		if (circles[i].x > (640-circles[i].radius) || circles[i].x < circles[i].radius)
		{
			circles[i].xv = -circles[i].xv;
		}
		if (circles[i].y > (640-circles[i].radius) || circles[i].y < circles[i].radius)
		{
			circles[i].yv = -circles[i].yv;
		}
	}
}

function draw()
{
	var context = document.getElementById('mainCanvas').getContext('2d');
	context.clearRect(0,0,640,640);
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
			context.fillStyle = "#FF0000"; //red
		}
		context.arc(circles[i].x, circles[i].y, circles[i].radius, 0, 2 * Math.PI, false);
		context.fill();
		context.closePath();

	}
}

var count = 0;

$(document).ready(function() {
	$(document.getElementById('mainCanvas')).click(function(e){
		circles[circles.length] = new Circle(mx, my, 6, count);

		count++;
		quad.insert(circles[circles.length-1]);
		console.log(mx+" "+my);
	});

	$(document.getElementById('mainCanvas')).mousemove(function(e) {
		var element = document.getElementById('QuadTree');

		mx = e.clientX - element.offsetLeft;
		my = e.clientY - element.offsetTop;
	});
});
setInterval(draw, 15);
