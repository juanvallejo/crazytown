crazytown
========

Purely-functional data structure for sets

##### What?

Library for creating "purely-functional" immutable sets.
Perform common `array` operations on sets without mutating
the initial set:

```js
var mySet = [1, 2, 3];
var collection = CTCollection(mySet);
var addItem = collection.push(4);

console.log(mySet);           // [1, 2, 3]
console.log(addItem.list());  // [1, 2, 3, 4]

addItem.push(5);
console.log(addItem.list());  // [1, 2, 3 ,4] -> data remained unchanged 
                              // without a new copy of `newItem` being created
					          // in memory
```

##### Why?

Memory efficiency.

A purely functional programming paradigm prevents mutating
existing values / data structures.

Although you could deep-copy a list and perform mutating operations
on the new copy in order to achieve this, the result is not
necessarily memory-efficient.

This library prevents data duplication, while preventing
mutations to the original set, by creating a node pointing to a "revision"
of a set any time a mutation occurs on its data. Rather than deep-copying
a given set, performing an operation such as `push(item)` on it, and returning
the altered copy with an extra `item`, the new item is saved, and a new node
is created that points to the original data plus the newly pushed item.

```js
var transformedList = mySet.transform(function(item, index) {
	if (index == 0) {
		return item + 100;
	}
	return item;
});

console.log(mySet.list());           // [1, 2, 3]
console.log(transformedList.list()); // [100, 2, 3]
```
