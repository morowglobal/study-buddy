# Week 4: Debugging

## Read the error message first

The error message tells you three things: the type of error, a short description, and the file and line number. Go to that line before changing anything. Most beginners skip the message and start guessing.

Common ones:
- ReferenceError: you used a name that does not exist (typo, or out of scope)
- TypeError: you used a value the wrong way, like calling something that is not a function, or reading a property of undefined
- SyntaxError: the code is not valid JavaScript, often a missing bracket or quote

## When there is no error but the result is wrong

Use console.log to check what a value really is at each step. Log the inputs, then the value inside the loop, then the result. The bug is between the last correct log and the first wrong one.

## Where NaN comes from

NaN means a math operation got something that is not a number. The usual causes: adding undefined (often from reading an array index that does not exist), dividing 0 by 0, or doing math with a string that cannot be turned into a number, like Number("abc"). NaN spreads: anything plus NaN is NaN.

## Rubber duck debugging

Explain your code line by line out loud, to a rubber duck or a friend. Halfway through you often hear the mistake yourself.

## Debugging with AI

Do not paste the error and copy the fix. Ask the AI to be a Socratic debugger: it asks you questions one at a time until you find the bug yourself. Slower once, but you remember the lesson.
