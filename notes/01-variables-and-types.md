# Week 1: Variables and types

## let and const

A variable is a labelled box that holds a value. Use const when the value will never be reassigned, and let when it will change. Start with const by default and only switch to let when you need to reassign. var is the old way and has weird scope rules, which is why we do not use it.

```js
const name = "Sara";
let score = 0;
score = score + 10;
```

Trying to reassign a const throws "TypeError: Assignment to constant variable."

## The basic types

- string: text in quotes, like "hello"
- number: 42, 3.14, also NaN ("not a number")
- boolean: true or false
- undefined: a variable that exists but has no value yet
- null: "empty on purpose", set by you
- object and array: groups of values

typeof tells you the type: typeof "hi" is "string". Weird one to remember for the quiz: typeof null is "object". It is an old bug in JavaScript that was never fixed.

## == vs ===

=== checks the value and the type. == converts types first, which gives surprising results: 0 == "" is true, but 0 === "" is false. That is why we always use ===.

## Template strings

Use backticks to put variables inside text: `Hi ${name}, your score is ${score}`. Much cleaner than adding strings with +.
