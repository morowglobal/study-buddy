# Week 3: Functions

## What a function is

A function is a reusable block of code with a name. It takes inputs (parameters) and can give back an output with return.

```js
function calculateAverage(scores) {
  let total = 0;
  for (const score of scores) total += score;
  return total / scores.length;
}
```

Calling it: calculateAverage([80, 90, 100]) gives 90.

## Arrow functions

A shorter way to write a function: const double = (n) => n * 2. With one expression, the result is returned automatically, no return keyword needed. With curly braces you must write return yourself. Forgetting return inside curly braces is a classic bug: the function gives back undefined.

## Default parameters

You can give a parameter a default value: function greet(name = "friend"). If you call greet() with nothing, name is "friend".

## Scope

Variables made with let or const inside a function or a block (anything in curly braces) only exist inside it. Outside, they are not defined and you get "ReferenceError: x is not defined". This is a good thing: it stops functions from changing each other's variables by accident.

## Pure functions

A pure function always gives the same output for the same input and does not change anything outside itself. They are the easiest functions to test and debug. Try to write most of your functions this way.
