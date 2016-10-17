/**
 * CrazyTown - A simple JavaScript library for minimizing array 
 * memory usage with a purely functional programming paradigm.
 */

// CTGraph receives a collection of items and returns a root
// node containing a set nodes. Each node points to a sub-set of
// CTGraph->items that correspond to it. A CTGraph node is,
// immutable, meaning items pointed to by a CTNode is never
// deleted or altered in any way. New items can be added and
// new nodes are created to point to new sub-sets of these items.
function CTGraph(collection) {
	var indices = [];
	for (var i = 0; i < collection.length; i++) {
		indices.push(i);
	}

	return CTNode(
		collection,
		indices, [], [], [], [],
		function(item, index) {
			return item;
		});
}

// CTNode receives a collection of items, a set of indices from
// each item of the collection that this node points to, and a
// filter function. These indices are stored and passed down
// to nodes containing sub-sets of the current node's sub-set.
//    collection      ->    pointer to original set of items
//    indices         ->    indices of items in original set that this node points to
//    added_items     ->    additional items added to the set
//    added_indices   ->    indices of additional items added to the set that this node points to
//    newItems        ->    list of new items to add to the sub-set that this node points to
//    newItemsWithMap ->    used to re-map existing items in an inherited sub-set to newly added ones
function CTNode(collection, indices, added_items, added_indices, newItems, newItemsWithMap, filter) {
	var node = {

		// items added to the main set after a
		// collection has been created. Stored
		// in a separate list to prevent
		// modifying the original one.
		added_items: [],

		// indices of new_items that have been
		// added to the main set, that are also
		// included in this node's sub-set
		added_indices: [],

		// indices of items from the main set
		// contained in this node's sub-set
		indices: [],

		// nodes pointing to sub-sets of this
		// node's own sub-set
		children: [],

		// map of indices pointing to transformation of existing items
		mapped_indices: [],

		items: collection,

		// creates a new node from a filtered sub-list
		filter: function(filterFn) {
			var newNode = CTNode(
				collection,
				node.indices,
				node.added_items,
				node.added_indices, [], [],
				filterFn);
			node.children.push(newNode);
			return newNode;
		},

		// iterates through each item in the node's
		// sub-set, calling a passed function with
		// an item and its current index as args.
		transform: function(fn) {
			var index = 0;
			var item = null;
			var new_item = null;
			var new_item_map = [];
			var actual_index = 0;
			for (var i = 0; i < node.indices.length + node.added_indices.length; i++) {
				if (i < node.indices.length) {
					index = node.indices[i];
					item = collection[index];
					actual_index = i;
				} else {
					index = node.added_indices[i - node.indices.length];
					item = added_items[index];
					actual_index = i - node.indices.length
				}
				new_item = fn(item, i);
				if (new_item !== null && new_item != item) {
					new_item_map.push({
						index: actual_index,
						isNew: (i >= node.indices.length),
						item: new_item
					});
				}

			}
			var newNode = CTNode(
				collection,
				node.indices,
				node.added_items,
				node.added_indices, [],
				new_item_map,
				function(item) {
					return item;
				});
			node.children.push(newNode);
			return newNode;
		},

		// returns the current node's filtered collection sub-set
		// in a new array object
		list: function() {
			return collectionFromNode(collection, node);
		},

		// retrieves an item at the specified index. If
		// no index is passed, the first item is returned.
		// If an out-of-range index is passed, a CTOutOfRange
		// exception will be thrown
		get: function(index) {
			if (index >= node.indices.length + node.added_indices.length) {
				console.trace(CTOutOfRangeException(index));
				throw CTOutOfRangeException(index);
			}
			if (!index) {
				return collection[node.indices[0]];
			}
			if (index < node.indices.length) {
				return collection[node.indices[index]];
			}
			return added_items[node.added_indices[index - node.indices.length]];
		},

		// returns the length of the sub-set of items
		// pointed to by this node
		length: function() {
			return node.indices.length + node.added_indices.length;
		},

		// creates a new node with pointers to all but
		// the last item in the original collection.
		pop: function() {
			var newNode = CTNode(
				collection,
				node.indices,
				node.added_items,
				node.added_indices, [], [],
				function(item, index, total) {
					if (index < total - 1) {
						return item;
					}
				});
			node.children.push(newNode);
			return newNode;
		},
		splice: function() {

		},
		push: function(newItem) {
			var newNode = CTNode(
				collection,
				node.indices,
				node.added_items,
				node.added_indices, [newItem], [],
				function(item, index) {
					return item;
				});
			node.children.push(newNode);
			return newNode;
		},

		// returns a copy
		getUnfilteredCollection: function() {
			var totalCollection = [];
			for (var i = 0; i < collection.length; i++) {
				totalCollection.push(collection[i]);
			}
			for (var i = 0; i < added_items.length; i++) {
				totalCollection.push(added_items[i]);
			}
			return totalCollection;
		},

		// returns a pointer to the original collection
		getOriginalCollection: function() {
			return collection;
		}
	};

	node.added_items = added_items;

	// add node filter indices from passed filter indices
	for (var i = 0; i < (indices.length + added_indices.length); i++) {
		if (i < indices.length) {
			if (filter(collection[indices[i]], i, indices.length + added_indices.length)) {
				node.indices.push(i);
			}
		} else {
			if (filter(added_items[added_indices[i - indices.length]], i, indices.length + added_indices.length)) {
				node.added_indices.push(i - indices.length);
			}
		}
	}

	// if new items, add to list and new item filter
	for (var i = 0; i < newItems.length; i++) {
		node.added_indices.push(node.added_items.length);
		node.added_items.push(newItems[i]);
	}

	// map new items, if any
	for (var i = 0; i < newItemsWithMap.length; i++) {
		node.added_items.push(newItemsWithMap[i].item);
		if (newItemsWithMap[i].isNew) {
			node.added_indices[newItemsWithMap[i].index] = node.added_items.length - 1;
			continue;
		}
		node.indices[newItemsWithMap[i].index] = collection.length + node.added_items.length - 1;
	}

	return node;
}

// CTCollection receives an array of items and returns
// a CTGraph with each of its nodes as an array item.
// A new collection object is also created and stored
// in CTGraph->collections to keep track of the original
// items in the initial array.
function CTCollection(collection) {
	return CTGraph(collection);
}

function CTOutOfRangeException(index) {
	return "The specified index (" + index + ") is out of range.";
}

function collectionFromIndices(collection, indices) {
	var items = [];
	for (var i = 0; i < indices.length; i++) {
		if (collection[indices[i]]) {
			items.push(collection[indices[i]])
			continue;
		}
		console.log('WARN', 'skipping index (' + indices[i] + ') out of range in collection', collection);
	}
	return items;
}

// creates a copy of a node's sub-set
function collectionFromNode(collection, node) {
	var items = [];
	var item = null;
	var index = 0;
	for (var i = 0; i < node.indices.length + node.added_indices.length; i++) {
		if (i < node.indices.length) {
			index = node.indices[i];
			item = node.items[index];

			// if index is out of range from the original list,
			// then assume item index has been remapped. Use
			// the new index and the mapped item from new list.
			if (index > node.items.length) {
				index -= node.indices.length;
				item = node.added_items[index];
			}

			items.push(item);
			continue;
		}
		index = node.added_indices[i - node.indices.length]
		item = node.added_items[index];
		items.push(item);
	}
	return items;
}

// only used for testing - should be removed once
// library is ready for production.
(function main(argv) {
	if (argv.length && argv[2] == 'test') {
		runTests();
	}
})(process.argv);

function runTests() {
	var immutableItems = [1, 2, 3, 4];
	var collection = CTCollection(immutableItems);
	var allButOne = collection.pop();
	var onlyOdds = collection.filter(function(item, index) {
		if (item % 2 != 0) {
			return item;
		}
	});

	// test basic filter
	AssertEquals('allButOne', [1, 2, 3].toString(), allButOne.list().toString());
	AssertEquals('onlyOdds', [1, 3].toString(), onlyOdds.list().toString());


	// add new item to collection
	var addElement = collection.push(5);
	// add new item to previous sub-set with added item
	var addElement2 = addElement.push(6);
	// add new item to first sub-set with added item
	var addElement3 = addElement.push(7);
	// add new item to addElement2
	var addElement4 = addElement2.push(8);
	// remove last element from addElement4
	var rmElement = addElement4.pop();
	// remove last element from rmElement
	var rmElement2 = rmElement.pop();
	// add element to set with removed element
	var addElemToRm = rmElement2.push(9);
	// test getting an element by its index
	var getElemLast = addElemToRm.get(5);
	// test getting an element by its index
	var getElemSecond = addElemToRm.get(1);
	// test big set with "added_items" set bigger than original set
	var bigSet = collection;
	for (var i = 0; i < 100; i++) {
		bigSet = bigSet.push(i + 200);
	}

	// test array operations
	AssertEquals('addElement(4)<-(5)', [1, 2, 3, 4, 5].toString(), addElement.list().toString());
	AssertEquals('addElement(4)<-(5)(6)', [1, 2, 3, 4, 5, 6].toString(), addElement2.list().toString());
	AssertEquals('addElement(4)<-(5)(7)', [1, 2, 3, 4, 5, 7].toString(), addElement3.list().toString());
	AssertEquals('addElement(4)<-(5)(6)(8)', [1, 2, 3, 4, 5, 6, 8].toString(), addElement4.list().toString());
	AssertEquals('rmElement(5)(6)(8)->(8)', [1, 2, 3, 4, 5, 6].toString(), rmElement.list().toString());
	AssertEquals('rmElement(5)(6)->(6)', [1, 2, 3, 4, 5].toString(), rmElement2.list().toString());
	AssertEquals('rmElement(5)<-(9)', [1, 2, 3, 4, 5, 9].toString(), addElemToRm.list().toString());
	AssertEquals('getElemLast(9)', 9, getElemLast);
	AssertEquals('getElemSecond(2)', 2, getElemSecond);

	// AssertEquals('getUnfilteredCollection', [1, 2, 3, 4, 5, 6, 7, 8, 9].toString(), addElemToRm.getUnfilteredCollection().toString());
	AssertEquals('listBeforeTransformation', [1, 2, 3, 4, 5, 9].toString(), addElemToRm.list().toString());

	transformedList = addElemToRm.transform(function(item, index) {
		if (index < 3 || index == 5) {
			return item + 100;
		}
		return item;
	});
	AssertNotEquals('listTransformationNotEquals', [1, 2, 3, 4, 5, 9].toString(), transformedList.list().toString());
	AssertEquals('listTransformation', [101, 102, 103, 4, 5, 109].toString(), transformedList.list().toString());
	AssertEquals('listAfterTransformation', [1, 2, 3, 4, 5, 9].toString(), addElemToRm.list().toString());

	// test array length
	AssertEquals('getArrayLength', 7, addElement4.length());

	// test get
	console.log();
	console.log('// test list get');
	console.log();
	for (var i = 0; i < addElement4.length(); i++) {
		var expected = i + 1;
		if (i == addElement4.length() - 1) {
			expected = 8;
		}
		AssertEquals('getFromList', expected, addElement4.get(i));
	}

	// test big sets
	AssertEquals('getLastElementFromBigSet', 299, bigSet.get(bigSet.length() - 1));

	// ensure that original set is still unchanged
	AssertEquals('ensureUnchangedOriginalSet', [1, 2, 3, 4].toString(), immutableItems);
}

function AssertEquals(testName, expected, actual) {
	if (expected != actual) {
		console.error('TEST FAILURE', testName, 'expected "', expected, '" but got "', actual, '"');
		return;
	}
	console.log('TEST OK', testName);
}

function AssertNotEquals(testName, expected, actual) {
	if (expected == actual) {
		console.error('TEST FAIL', testName, 'expected "', expected, '" to not equal "', actual, '"');
		return;
	}
	console.log('TEST OK', testName);
}

module.exports = CTCollection;