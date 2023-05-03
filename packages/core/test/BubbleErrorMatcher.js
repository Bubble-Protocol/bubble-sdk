import { BubbleError } from "../src";


function toBeBubbleError(received, expected={}) {

  if (toString.call(expected) !== '[object Object]' && !(expected instanceof BubbleError)) {
    return {
      pass: false, 
      message: () => `must pass an object as the parameter to the custom Jest matcher 'toThrowBubbleError'.  Object can contain code, message and/or cause fields.`
    }
  }

  if (!received) {
    return {
      pass: false, 
      message: () => `Expected a BubbleError but received nothing`
    }
  }

  if (!(received instanceof BubbleError)) {
    return {
      pass: false, 
      message: () => `not a BubbleError - ${received ? received.toString() : 'null'}`
    }
  }

  if (expected.code !== undefined && (received.code !== expected.code)) {
    return {
      pass: false, 
      message: () => `Expected error code ${expected.code}, received ${received.code} (message: "${received.message}", cause: "${received.cause}")`
    }
  }

  if (expected.message !== undefined && (expected.message instanceof RegExp) && !expected.message.test(received.message)) {
    return {
      pass: false, 
      message: () => `Expected message to match "${expected.message}" but received "${received.message}" (cause: "${received.cause}")`
    }
  }

  if (expected.message !== undefined && !(expected.message instanceof RegExp) && received.message !== expected.message) {
    return {
      pass: false, 
      message: () => `Expected message to equal "${expected.message}" but received "${received.message}" (cause: "${received.cause}")`
    }
  }

  if (expected.cause !== undefined && (received.cause !== expected.cause)) {
    return {
      pass: false, 
      message: () => `Expected cause "${expected.cause}", received "${received.cause}")`
    }
  }

  return {
    pass: true, 
    message: () => 'Expected error not to be BubbleError'
  }

} 


function toThrowBubbleError(fn, expected) {

  if (toString.call(fn) !== '[object Function]' ) {
    return {
      pass: false, 
      message: () => `must pass a function to the custom Jest matcher 'toThrowBubbleError'`
    }
  }

  try {
    fn();
    return {
      pass: false, 
      message: () => `Did not throw an error`
    }
  }
  catch(received) {
    return toBeBubbleError(received, expected);
  }

}


expect.extend({
  toThrowBubbleError,
  toBeBubbleError
});

