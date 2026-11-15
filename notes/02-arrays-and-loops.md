# Week 2: Arrays and loops

## Arrays

An array is an ordered list: const scores = [80, 90, 100]. Indexes start at 0, so scores[0] is 80 and scores[2] is 100. scores.length is 3, which is one more than the last index. Reading an index that does not exist, like scores[3], does not crash. It gives undefined.

Useful methods: push adds to the end, pop removes from the end, includes checks if a value is in the array, and indexOf gives the position (or -1 if it is not there).

## The for loop

```js
for (let i = 0; i < scores.length; i++) {
  console.log(scores[i]);
}
```

Three parts: start (let i = 0), condition (i < scores.length), step (i++). The loop runs while the condition is true.

## Off-by-one errors

The most common loop bug. If you write i <= scores.length, the loop runs one extra time and reads scores[3], which is undefined. Adding undefined to a number gives NaN, so a total or an average suddenly becomes NaN. Fix: use < instead of <=. Ms. Rivera says to always check the last value i takes.

## for...of

When you only need the values, not the index, for...of is simpler and cannot go off by one:

```js
for (const score of scores) {
  total += score;
}
```

## map and filter

map makes a new array by changing every item: scores.map(s => s + 5). filter keeps only the items that pass a test: scores.filter(s => s >= 90). Neither changes the original array.
