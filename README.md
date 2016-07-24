# sweet-tensors
##Tensor index notation in javascript using sweet.js

This sweet.js macro allows you to write javascript for loops through the power and simplicity of the [tensor index notation](https://en.wikipedia.org/wiki/Ricci_calculus).

###What is Index notation?

Not familiar with index notation? Observe:

    foo[i][j] = bar[i] + baz[j]

This is the sort of code you normally expect to see inside a double for loop. You know that because you see there are two index variables, `i` and `j`. `i` is used to iterate through bar, and `j` is used to iterate through baz. The lower bound of `i` and `j` is 0. The upper bound of `i` and `j` is determined by the size of their respective arrays. For every value in bar and baz, we populate a cell in `foo` with their sum. Simple. You know all this right away and you never looked at a single for loop. You pieced it all together through convention and reasoning. The for loops are just formality.

Tensor index notation skips the formality. In tensor calculus, the "for loops" are implied by the index. There are a few other rules that govern its use in mathematics, but for our sake we will ignore them.

If we want to implement this index notation, a macro need only traverse the expression, find the indices, and associate each index with the array that preceded it. We no longer have to write for loops. The only fluff we still need is a keyword to kick off the macro. 

So this:

	tensor foo[i][j] = bar[i] + baz[j];

Expands to this:

	for (var j = 0, lj = baz.length; j < lj; j++) {
	  for (var i = 0, li = bar.length; i < li; i++) {
	    foo[i] = bar[i] + baz[j];
	  }
	}

###Tutorial

	tensor foo[i][j] = bar[i] + baz[j];

`tensor` is the keyword that kicks off the macro. It separates the code that uses the index notation from the code that doesn't. By default, the macro treats anything up to the semi-colon as a member of the tensor statement. This is an important gotcha - a single line tensor statement needs to be terminated with a semi-colon. This is due to a limitation in the macro engine. It is good practice to use semi-colons, in any case. 

If this fact bugs you, you can also wrap the tensor code within a pair of braces, just as you would with any `if` or `for` loop. This has the added benefit of allowing multi-line blocks of tensor code:

	tensor {
		foo[i][j] = bar[i]
		foo[i][j] += baz[j]
	}

Within a single block of tensor code, all single letter variables act as indices, provided there is at least one occurrence of an index being wrapped alone in brackets. 

	tensor foo[i] = bar[map[i]] + baz[j-1] + k;

In the example above, `map` is not an index because its name contains more than one letter. The constant `k` is not an index because it never occurs within a pair of brackets and we have no way to determine its upper bound. The variable `i` is indeed an index because it is a single letter variable and it occurs at least once by itself in a pair of brackets. 

The index variable must occur at least once on its own inside the brackets. In the following code:

    tensor penultimate = array[i-1];

`i` is not recognized as an index because when it occurs inside the brackets it is accompanied by a `-1`. It is not certain in the general case for the macro to know what the bounds of `i` should be. On the other hand,

	tensor if(i>0) diff[i-1] = foo[i] - foo[i-1];

`i` is an index in the example above because there is one instance where it occurs alone in a pair of brackets: `foo[i]`. 

The lower bound of an index is always 0. The upper bound of an index is determined by the length of the last array to use the index. In the following code:

	tensor foo[i] = bar[map[i]];

The upper bound of `i` is set to `map.length` because `map` was the last array to use the index in the statement. It is up to the user to ensure `foo` is the same size as `map`.

The upper bound of an index can be retrieved by appending "l" to the start of the variable name, e.g., the upper bound of index `i` is `li`. This is sometimes a more efficient way to retrieve the length of an array because it is not reevaluated at every invocation, as it would be with `.length`.

	tensor mean += foo[i] / li;

The example above calculates the mean of all values within `foo`. It is more efficient than calling:

	tensor mean += foo[i] / foo.length;

However, please note it is not the most efficient method, because division occurs with every iteration. A more efficient implementation would be:

	tensor mean += foo[i];
	mean /= foo.length;

The tensor macro is a dumb thing. It doesn't check to see when there is a division by a constant. All it does is expand the for loop in the most efficient way afforded by the general case.

###Example Usage
You can use tensors to replicate most of the built in support for functional programming:

	// 		foo = bar.map(map_fn);
	tensor 	foo[i] = map_fn(bar[i]);

	// 		foo = bar.filter(filter_fn);
	tensor 	if( filter_fn(bar[i]) ) foo.push( bar[i] );

	// alternate to the above
	var j = 0;
	tensor 	if( filter_fn(bar[i]) ) foo[j++] = bar[i];

	//      foo = bar.reduce(reduce_fn, 0);
	var foo = 0;
	tensor 	foo = reduce_fn( foo, bar[i] );
	
	//		foo.forEach(forEach_fn);
	tensor 	forEach_fn( foo[i] );

In certain cases the tensor statements will be faster than the built in equivalents. The use of tensors will almost always be faster than using anonymous functions.

Other built in methods can be replicated, as well. The practicality is questionable, but it does demonstrate just how versatile the macro can be.

	// 		foo.fill(0);
	tensor 	foo[i] = 0;

	// 		foo.reverse();
	tensor {
		if(i>li/2) break;
		var temp = foo[i];
		foo[i] = foo[i-1];
		foo[i-1] = temp;
	}

	//		foo = bar.every(test_fn)
	var foo = true;
	tensor 	foo = foo && test_fn(foo[i]);

	//		foo = bar.some(test_fn)
	var foo = false;
	tensor 	foo = foo || test_fn(foo[i]);

It also allows you to easily import programming paradigms from other languages. Take for instance the [logical index vector](http://www.r-tutor.com/r-introduction/vector/logical-index-vector) in R:

	//		strings = ['a','b','c','d','e'];
	//		bools 	= [false, true, false, true, false];
	tensor 	if(bools[i]) filtered.push( strings[i] );

