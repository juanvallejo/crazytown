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
		indices, [], [], [],
		function(item, index) {
			return item;
		});
}

// CTNode receives a collection of items, a set of indices from
// each item of the collection that this node points to, and a
// filter function. These indices are stored and passed down
// to nodes containing sub-sets of the current node's sub-set.
//    collection    ->    pointer to original set of items
//    indices       ->    indices of items in original set that this node points to
//    added_items   ->    additional items added to the set
//    added_indices ->    indices of additional items added to the set that this node points to
//    newItems      ->    list of new items to add to the sub-set that this node points to
function CTNode(collection, indices, added_items, added_indices, newItems, filter) {
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

		// creates a new node from a filtered sub-list
		filter: function(filterFn) {
			var newNode = CTNode(
				collection,
				node.indices,
				node.added_items,
				node.added_indices, [],
				filterFn);
			node.children.push(newNode);
			return newNode;
		},

		// iterates through each item in the node's
		// sub-set, calling a passed function with
		// an item and its current index as args.
		traverse: function(fn) {
			for (var i = 0; i < node.indices.length; i++) {
				fn(collection[node.indices[i]], i);
			}
			return node;
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
			if (index >= node.indices.length) {
				throw CTOutOfRangeException(index);
			}
			if (!index) {
				return collection[node.indices[0]];
			}
			return collection[node.indices[index]];
		},

		// returns the length of the sub-set of items
		// pointed to by this node
		length: function() {
			return node.indices.length;
		},

		// creates a new node with pointers to all but
		// the last item in the original collection.
		pop: function() {
			var newNode = CTNode(
				collection,
				node.indices,
				node.added_items,
				node.added_indices, [],
				function(item, index) {
					if (index < node.indices.length - 1) {
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
				node.added_indices, [newItem],
				function(item, index) {
					return item;
				});
			node.children.push(newNode);
			return newNode;
		}
	};

	node.added_items = added_items;

	// add node filter indices from passed filter indices
	for (var i = 0; i < (indices.length + added_indices.length); i++) {
		if (i < indices.length) {
			if (filter(collection[indices[i]], i)) {
				node.indices.push(i);
			}
		} else {
			if (filter(added_items[added_indices[i % indices.length]], i)) {
				node.added_indices.push(i % indices.length);
			}
		}
	}

	// if new items, add to list and new item filter
	for (var i = 0; i < newItems.length; i++) {
		node.added_indices.push(node.added_items.length);
		node.added_items.push(newItems[i]);
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

function collectionFromNode(collection, node) {

	return [];
}

// only used for testing - should be removed once
// library is ready for production.
(function main() {
	var immutableItems = [1, 2, 3, 4];
	var collection = CTCollection(immutableItems);
	var allButOne = collection.pop();
	var onlyOdds = collection.filter(function(item, index) {
		if (item % 2 != 0) {
			return item;
		}
	});

	// TODO fix every operation to work with added_items list

	// add new item to collection
	var addElement = collection.push(5);
	// add new item to previous sub-set with added item
	var addElement2 = addElement.push(6);
	// add new item to first sub-set with added item
	var addElement3 = addElement.push(7);
	// add new item to addElement2
	var addElement4 = addElement2.push(8);
	// console.log(addElement.list());
})();