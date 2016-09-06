/**
 * elasticlunr - http://weixsong.github.io
 * Lightweight full-text search engine in Javascript for browser search and offline search. - 0.8.9
 *
 * Copyright (C) 2016 Oliver Nightingale
 * Copyright (C) 2016 Wei Song
 * MIT Licensed
 * @license
 */

(function(){

/*!
 * elasticlunr.js
 * Copyright (C) 2016 Oliver Nightingale
 * Copyright (C) 2016 Wei Song
 */

/**
 * Convenience function for instantiating a new elasticlunr index and configuring it
 * with the default pipeline functions and the passed config function.
 *
 * When using this convenience function a new index will be created with the
 * following functions already in the pipeline:
 * 
 * 1. elasticlunr.trimmer - trim non-word character
 * 2. elasticlunr.StopWordFilter - filters out any stop words before they enter the
 * index
 * 3. elasticlunr.stemmer - stems the tokens before entering the index.
 *
 *
 * Example:
 *
 *     var idx = elasticlunr(function () {
 *       this.addField('id');
 *       this.addField('title');
 *       this.addField('body');
 *       
 *       //this.setRef('id'); // default ref is 'id'
 *
 *       this.pipeline.add(function () {
 *         // some custom pipeline function
 *       });
 *     });
 * 
 *    idx.addDoc({
 *      id: 1, 
 *      title: 'Oracle released database 12g',
 *      body: 'Yestaday, Oracle has released their latest database, named 12g, more robust. this product will increase Oracle profit.'
 *    });
 * 
 *    idx.addDoc({
 *      id: 2, 
 *      title: 'Oracle released annual profit report',
 *      body: 'Yestaday, Oracle has released their annual profit report of 2015, total profit is 12.5 Billion.'
 *    });
 * 
 *    # simple search
 *    idx.search('oracle database');
 * 
 *    # search with query-time boosting
 *    idx.search('oracle database', {fields: {title: {boost: 2}, body: {boost: 1}}});
 *
 * @param {Function} config A function that will be called with the new instance
 * of the elasticlunr.Index as both its context and first parameter. It can be used to
 * customize the instance of new elasticlunr.Index.
 * @namespace
 * @module
 * @return {elasticlunr.Index}
 *
 */
var elasticlunr = function (config) {
  var idx = new elasticlunr.Index;

  idx.pipeline.add(
    elasticlunr.trimmer,
    elasticlunr.stopWordFilter,
    elasticlunr.stemmer
  );

  if (config) config.call(idx, idx);

  return idx;
};

elasticlunr.version = "0.8.9";
/*!
 * elasticlunr.utils
 * Copyright (C) 2016 Oliver Nightingale
 * Copyright (C) 2016 Wei Song
 */

/**
 * A namespace containing utils for the rest of the elasticlunr library
 */
elasticlunr.utils = {};

/**
 * Print a warning message to the console.
 *
 * @param {String} message The message to be printed.
 * @memberOf Utils
 */
elasticlunr.utils.warn = (function (global) {
  return function (message) {
    if (global.console && console.warn) {
      console.warn(message);
    }
  };
})(this);

/**
 * Convert an object to string.
 *
 * In the case of `null` and `undefined` the function returns
 * an empty string, in all other cases the result of calling
 * `toString` on the passed object is returned.
 *
 * @param {object} obj The object to convert to a string.
 * @return {String} string representation of the passed object.
 * @memberOf Utils
 */
elasticlunr.utils.toString = function (obj) {
  if (obj === void 0 || obj === null) {
    return "";
  }

  return obj.toString();
};
/*!
 * elasticlunr.EventEmitter
 * Copyright (C) 2016 Oliver Nightingale
 * Copyright (C) 2016 Wei Song
 */

/**
 * elasticlunr.EventEmitter is an event emitter for elasticlunr.
 * It manages adding and removing event handlers and triggering events and their handlers.
 *
 * Each event could has multiple corresponding functions,
 * these functions will be called as the sequence that they are added into the event.
 * 
 * @constructor
 */
elasticlunr.EventEmitter = function () {
  this.events = {};
};

/**
 * Binds a handler function to a specific event(s).
 *
 * Can bind a single function to many different events in one call.
 *
 * @param {String} [eventName] The name(s) of events to bind this function to.
 * @param {Function} fn The function to call when an event is fired.
 * @memberOf EventEmitter
 */
elasticlunr.EventEmitter.prototype.addListener = function () {
  var args = Array.prototype.slice.call(arguments),
      fn = args.pop(),
      names = args;

  if (typeof fn !== "function") throw new TypeError ("last argument must be a function");

  names.forEach(function (name) {
    if (!this.hasHandler(name)) this.events[name] = [];
    this.events[name].push(fn);
  }, this);
};

/**
 * Removes a handler function from a specific event.
 *
 * @param {String} eventName The name of the event to remove this function from.
 * @param {Function} fn The function to remove from an event.
 * @memberOf EventEmitter
 */
elasticlunr.EventEmitter.prototype.removeListener = function (name, fn) {
  if (!this.hasHandler(name)) return;

  var fnIndex = this.events[name].indexOf(fn);
  if (fnIndex === -1) return;

  this.events[name].splice(fnIndex, 1);

  if (this.events[name].length == 0) delete this.events[name];
};

/**
 * Call all functions that bounded to the given event.
 *
 * Additional data can be passed to the event handler as arguments to `emit`
 * after the event name.
 *
 * @param {String} eventName The name of the event to emit.
 * @memberOf EventEmitter
 */
elasticlunr.EventEmitter.prototype.emit = function (name) {
  if (!this.hasHandler(name)) return;

  var args = Array.prototype.slice.call(arguments, 1);

  this.events[name].forEach(function (fn) {
    fn.apply(undefined, args);
  }, this);
};

/**
 * Checks whether a handler has ever been stored against an event.
 *
 * @param {String} eventName The name of the event to check.
 * @private
 * @memberOf EventEmitter
 */
elasticlunr.EventEmitter.prototype.hasHandler = function (name) {
  return name in this.events;
};
/*!
 * elasticlunr.tokenizer
 * Copyright (C) 2016 Oliver Nightingale
 * Copyright (C) 2016 Wei Song
 */

/**
 * A function for splitting a string into tokens.
 * Currently English is supported as default.
 * Uses `elasticlunr.tokenizer.seperator` to split strings, you could change
 * the value of this property to set how you want strings are split into tokens.
 * IMPORTANT: use elasticlunr.tokenizer.seperator carefully, if you are not familiar with
 * text process, then you'd better not change it.
 *
 * @module
 * @param {String} str The string that you want to tokenize.
 * @see elasticlunr.tokenizer.seperator
 * @return {Array}
 */
elasticlunr.tokenizer = function (str) {
  if (!arguments.length || str === null || str === undefined) return [];
  if (Array.isArray(str)) {
    var arr = str.filter(function(token) {
      if (token === null || token === undefined) {
        return false;
      }

      return true;
    });

    arr = arr.map(function (t) {
      return elasticlunr.utils.toString(t).toLowerCase();
    });

    var out = [];
    arr.forEach(function(item) {
      var tokens = item.split(elasticlunr.tokenizer.seperator);
      out = out.concat(tokens);
    }, this);

    return out;
  }

  return str.toString().trim().toLowerCase().split(elasticlunr.tokenizer.seperator);
};

/**
 * Default string seperator.
 */
elasticlunr.tokenizer.defaultSeperator = /[\s\-]+/;

/**
 * The sperator used to split a string into tokens. Override this property to change the behaviour of
 * `elasticlunr.tokenizer` behaviour when tokenizing strings. By default this splits on whitespace and hyphens.
 *
 * @static
 * @see elasticlunr.tokenizer
 */
elasticlunr.tokenizer.seperator = elasticlunr.tokenizer.defaultSeperator;

/**
 * Set up customized string seperator
 *
 * @param {Object} sep The customized seperator that you want to use to tokenize a string.
 */
elasticlunr.tokenizer.setSeperator = function(sep) {
    if (sep !== null && sep !== undefined && typeof(sep) === 'object') {
        elasticlunr.tokenizer.seperator = sep;
    }
}

/**
 * Reset string seperator
 *
 */
elasticlunr.tokenizer.resetSeperator = function() {
    elasticlunr.tokenizer.seperator = elasticlunr.tokenizer.defaultSeperator;
}

/**
 * Get string seperator
 *
 */
elasticlunr.tokenizer.getSeperator = function() {
    return elasticlunr.tokenizer.seperator;
}
/*!
 * elasticlunr.Pipeline
 * Copyright (C) 2016 Oliver Nightingale
 * Copyright (C) 2016 Wei Song
 */

/**
 * elasticlunr.Pipelines maintain an ordered list of functions to be applied to 
 * both documents tokens and query tokens.
 *
 * An instance of elasticlunr.Index will contain a pipeline
 * with a trimmer, a stop word filter, an English stemmer. Extra
 * functions can be added before or after either of these functions or these
 * default functions can be removed.
 *
 * When run the pipeline, it will call each function in turn.
 *
 * The output of the functions in the pipeline will be passed to the next function
 * in the pipeline. To exclude a token from entering the index the function
 * should return undefined, the rest of the pipeline will not be called with
 * this token.
 *
 * For serialisation of pipelines to work, all functions used in an instance of
 * a pipeline should be registered with elasticlunr.Pipeline. Registered functions can
 * then be loaded. If trying to load a serialised pipeline that uses functions
 * that are not registered an error will be thrown.
 *
 * If not planning on serialising the pipeline then registering pipeline functions
 * is not necessary.
 *
 * @constructor
 */
elasticlunr.Pipeline = function () {
  this._queue = [];
};

elasticlunr.Pipeline.registeredFunctions = {};

/**
 * Register a function in the pipeline.
 *
 * Functions that are used in the pipeline should be registered if the pipeline
 * needs to be serialised, or a serialised pipeline needs to be loaded.
 *
 * Registering a function does not add it to a pipeline, functions must still be
 * added to instances of the pipeline for them to be used when running a pipeline.
 *
 * @param {Function} fn The function to register.
 * @param {String} label The label to register this function with
 * @memberOf Pipeline
 */
elasticlunr.Pipeline.registerFunction = function (fn, label) {
  if (label in elasticlunr.Pipeline.registeredFunctions) {
    elasticlunr.utils.warn('Overwriting existing registered function: ' + label);
  }

  fn.label = label;
  elasticlunr.Pipeline.registeredFunctions[label] = fn;
};

/**
 * Get a registered function in the pipeline.
 *
 * @param {String} label The label of registered function.
 * @return {Function}
 * @memberOf Pipeline
 */
elasticlunr.Pipeline.getRegisteredFunction = function (label) {
  if ((label in elasticlunr.Pipeline.registeredFunctions) !== true) {
    return null;
  }

  return elasticlunr.Pipeline.registeredFunctions[label];
};

/**
 * Warns if the function is not registered as a Pipeline function.
 *
 * @param {Function} fn The function to check for.
 * @private
 * @memberOf Pipeline
 */
elasticlunr.Pipeline.warnIfFunctionNotRegistered = function (fn) {
  var isRegistered = fn.label && (fn.label in this.registeredFunctions);

  if (!isRegistered) {
    elasticlunr.utils.warn('Function is not registered with pipeline. This may cause problems when serialising the index.\n', fn);
  }
};

/**
 * Loads a previously serialised pipeline.
 *
 * All functions to be loaded must already be registered with elasticlunr.Pipeline.
 * If any function from the serialised data has not been registered then an
 * error will be thrown.
 *
 * @param {Object} serialised The serialised pipeline to load.
 * @return {elasticlunr.Pipeline}
 * @memberOf Pipeline
 */
elasticlunr.Pipeline.load = function (serialised) {
  var pipeline = new elasticlunr.Pipeline;

  serialised.forEach(function (fnName) {
    var fn = elasticlunr.Pipeline.getRegisteredFunction(fnName);

    if (fn) {
      pipeline.add(fn);
    } else {
      throw new Error('Cannot load un-registered function: ' + fnName);
    }
  });

  return pipeline;
};

/**
 * Adds new functions to the end of the pipeline.
 *
 * Logs a warning if the function has not been registered.
 *
 * @param {Function} functions Any number of functions to add to the pipeline.
 * @memberOf Pipeline
 */
elasticlunr.Pipeline.prototype.add = function () {
  var fns = Array.prototype.slice.call(arguments);

  fns.forEach(function (fn) {
    elasticlunr.Pipeline.warnIfFunctionNotRegistered(fn);
    this._queue.push(fn);
  }, this);
};

/**
 * Adds a single function after a function that already exists in the
 * pipeline.
 *
 * Logs a warning if the function has not been registered.
 * If existingFn is not found, throw an Exception.
 *
 * @param {Function} existingFn A function that already exists in the pipeline.
 * @param {Function} newFn The new function to add to the pipeline.
 * @memberOf Pipeline
 */
elasticlunr.Pipeline.prototype.after = function (existingFn, newFn) {
  elasticlunr.Pipeline.warnIfFunctionNotRegistered(newFn);

  var pos = this._queue.indexOf(existingFn);
  if (pos === -1) {
    throw new Error('Cannot find existingFn');
  }

  this._queue.splice(pos + 1, 0, newFn);
};

/**
 * Adds a single function before a function that already exists in the
 * pipeline.
 *
 * Logs a warning if the function has not been registered.
 * If existingFn is not found, throw an Exception.
 *
 * @param {Function} existingFn A function that already exists in the pipeline.
 * @param {Function} newFn The new function to add to the pipeline.
 * @memberOf Pipeline
 */
elasticlunr.Pipeline.prototype.before = function (existingFn, newFn) {
  elasticlunr.Pipeline.warnIfFunctionNotRegistered(newFn);

  var pos = this._queue.indexOf(existingFn);
  if (pos === -1) {
    throw new Error('Cannot find existingFn');
  }

  this._queue.splice(pos, 0, newFn);
};

/**
 * Removes a function from the pipeline.
 *
 * @param {Function} fn The function to remove from the pipeline.
 * @memberOf Pipeline
 */
elasticlunr.Pipeline.prototype.remove = function (fn) {
  var pos = this._queue.indexOf(fn);
  if (pos === -1) {
    return;
  }

  this._queue.splice(pos, 1);
};

/**
 * Runs the current list of functions that registered in the pipeline against the
 * input tokens.
 *
 * @param {Array} tokens The tokens to run through the pipeline.
 * @return {Array}
 * @memberOf Pipeline
 */
elasticlunr.Pipeline.prototype.run = function (tokens) {
  var out = [],
      tokenLength = tokens.length,
      pipelineLength = this._queue.length;

  for (var i = 0; i < tokenLength; i++) {
    var token = tokens[i];

    for (var j = 0; j < pipelineLength; j++) {
      token = this._queue[j](token, i, tokens);
      if (token === void 0 || token === null) break;
    };

    if (token !== void 0 && token !== null) out.push(token);
  };

  return out;
};

/**
 * Resets the pipeline by removing any existing processors.
 *
 * @memberOf Pipeline
 */
elasticlunr.Pipeline.prototype.reset = function () {
  this._queue = [];
};

 /**
  * Get the pipeline if user want to check the pipeline.
  *
  * @memberOf Pipeline
  */
 elasticlunr.Pipeline.prototype.get = function () {
   return this._queue;
 };

/**
 * Returns a representation of the pipeline ready for serialisation.
 * Only serialize pipeline function's name. Not storing function, so when
 * loading the archived JSON index file, corresponding pipeline function is 
 * added by registered function of elasticlunr.Pipeline.registeredFunctions
 *
 * Logs a warning if the function has not been registered.
 *
 * @return {Array}
 * @memberOf Pipeline
 */
elasticlunr.Pipeline.prototype.toJSON = function () {
  return this._queue.map(function (fn) {
    elasticlunr.Pipeline.warnIfFunctionNotRegistered(fn);
    return fn.label;
  });
};
elasticlunr.FieldTokenizer = function () {
  this._tokenizer = {};
};

elasticlunr.FieldTokenizer.load = function() {
  return new elasticlunr.FieldTokenizer;
}

elasticlunr.FieldTokenizer.prototype.tokenizer = function (str, field) {
  var tokenizer = this.getFieldTokenizer(field);
  if (tokenizer) {
    return tokernizer(str);
  }
  return elasticlunr.tokenizer(str);
};

elasticlunr.FieldTokenizer.prototype.getFieldTokenizer = function(field) {
  var tokenizer = this._tokenizer[field];
  if (tokenizer && typeof tokenizer === 'function') {
    return tokenizer;
  }
  return undefined;
}

elasticlunr.FieldTokenizer.prototype.registerFieldTokenizer = function(tokenizer, field) {
  var tokenizer = this.getFieldTokenizer(field);
  if (tokenizer) {
    elasticlunr.utils.warn('Tokenizer for field "' + field +'" is already registered.\n', tokenizer);
  }
  this._tokenizer[field] = tokenizer;
}

elasticlunr.FieldTokenizer.prototype.unregisterFieldTokenizer = function(tokenizer, field) {
  this._tokenizer[field] = undefined;
}
/*!
 * elasticlunr.Index
 * Copyright (C) 2016 Oliver Nightingale
 * Copyright (C) 2016 Wei Song
 */

/**
 * elasticlunr.Index is object that manages a search index.  It contains the indexes
 * and stores all the tokens and document lookups.  It also provides the main
 * user facing API for the library.
 *
 * @constructor
 */
elasticlunr.Index = function () {
  this._fields = [];
  this._ref = 'id';
  this.pipeline = new elasticlunr.Pipeline;
  this.fieldTokenizer = new elasticlunr.FieldTokenizer;
  this.documentStore = new elasticlunr.DocumentStore;
  this.index = {};
  this.eventEmitter = new elasticlunr.EventEmitter;
  this._idfCache = {};

  this.on('add', 'remove', 'update', (function () {
    this._idfCache = {};
  }).bind(this));
};

/**
 * Bind a handler to events being emitted by the index.
 *
 * The handler can be bound to many events at the same time.
 *
 * @param {String} [eventName] The name(s) of events to bind the function to.
 * @param {Function} fn The serialised set to load.
 * @memberOf Index
 */
elasticlunr.Index.prototype.on = function () {
  var args = Array.prototype.slice.call(arguments);
  return this.eventEmitter.addListener.apply(this.eventEmitter, args);
};

/**
 * Removes a handler from an event being emitted by the index.
 *
 * @param {String} eventName The name of events to remove the function from.
 * @param {Function} fn The serialised set to load.
 * @memberOf Index
 */
elasticlunr.Index.prototype.off = function (name, fn) {
  return this.eventEmitter.removeListener(name, fn);
};

/**
 * Loads a previously serialised index.
 *
 * Issues a warning if the index being imported was serialised
 * by a different version of elasticlunr.
 *
 * @param {Object} serialisedData The serialised set to load.
 * @return {elasticlunr.Index}
 * @memberOf Index
 */
elasticlunr.Index.load = function (serialisedData) {
  if (serialisedData.version !== elasticlunr.version) {
    elasticlunr.utils.warn('version mismatch: current '
                    + elasticlunr.version + ' importing ' + serialisedData.version);
  }

  var idx = new this;

  idx._fields = serialisedData.fields;
  idx._ref = serialisedData.ref;
  idx.documentStore = elasticlunr.DocumentStore.load(serialisedData.documentStore);
  idx.pipeline = elasticlunr.Pipeline.load(serialisedData.pipeline);
  idx.fieldTokenizer = elasticlunr.FieldTokenizer.load(serialisedData.fieldTokenizer);
  idx.index = {};
  for (var field in serialisedData.index) {
    idx.index[field] = elasticlunr.InvertedIndex.load(serialisedData.index[field]);
  }

  return idx;
};

/**
 * Adds a field to the list of fields that will be searchable within documents in the index.
 *
 * Remember that inner index is build based on field, which means each field has one inverted index.
 *
 * Fields should be added before any documents are added to the index, fields
 * that are added after documents are added to the index will only apply to new
 * documents added to the index.
 *
 * @param {String} fieldName The name of the field within the document that should be indexed
 * @return {elasticlunr.Index}
 * @memberOf Index
 */
elasticlunr.Index.prototype.addField = function (fieldName, tokenizer) {
  this._fields.push(fieldName);
  this.index[fieldName] = new elasticlunr.InvertedIndex;
  if (tokenizer && typeof tokenizer === 'function') {
    this.fieldTokenizer.registerFieldTokenizer(tokenizer, fieldName);
  }
  return this;
};

/**
 * Sets the property used to uniquely identify documents added to the index,
 * by default this property is 'id'.
 *
 * This should only be changed before adding documents to the index, changing
 * the ref property without resetting the index can lead to unexpected results.
 *
 * @param {String} refName The property to use to uniquely identify the
 * documents in the index.
 * @param {Boolean} emitEvent Whether to emit add events, defaults to true
 * @return {elasticlunr.Index}
 * @memberOf Index
 */
elasticlunr.Index.prototype.setRef = function (refName) {
  this._ref = refName;
  return this;
};

/**
 *
 * Set if the JSON format original documents are save into elasticlunr.DocumentStore
 *
 * Defaultly save all the original JSON documents.
 *
 * @param {Boolean} save Whether to save the original JSON documents.
 * @return {elasticlunr.Index}
 * @memberOf Index
 */
elasticlunr.Index.prototype.saveDocument = function (save) {
  this.documentStore = new elasticlunr.DocumentStore(save);
  return this;
};

/**
 * Add a JSON format document to the index.
 *
 * This is the way new documents enter the index, this function will run the
 * fields from the document through the index's pipeline and then add it to
 * the index, it will then show up in search results.
 *
 * An 'add' event is emitted with the document that has been added and the index
 * the document has been added to. This event can be silenced by passing false
 * as the second argument to add.
 *
 * @param {Object} doc The JSON format document to add to the index.
 * @param {Boolean} emitEvent Whether or not to emit events, default true.
 * @memberOf Index
 */
elasticlunr.Index.prototype.addDoc = function (doc, emitEvent) {
  if (!doc) return;
  var emitEvent = emitEvent === undefined ? true : emitEvent;

  var docRef = doc[this._ref];

  this.documentStore.addDoc(docRef, doc);
  this._fields.forEach(function (field) {
    var fieldTokens = this.pipeline.run(this.fieldTokenizer.tokenizer(doc[field], field));
    this.documentStore.addFieldLength(docRef, field, fieldTokens.length);

    var tokenCount = {};
    fieldTokens.forEach(function (token) {
      if (token in tokenCount) tokenCount[token] += 1;
      else tokenCount[token] = 1;
    }, this);

    for (var token in tokenCount) {
      var termFrequency = tokenCount[token];
      termFrequency = Math.sqrt(termFrequency);
      this.index[field].addToken(token, { ref: docRef, tf: termFrequency });
    }
  }, this);

  if (emitEvent) this.eventEmitter.emit('add', doc, this);
};

/**
 * Removes a document from the index by doc ref.
 *
 * To make sure documents no longer show up in search results they can be
 * removed from the index using this method.
 *
 * A 'remove' event is emitted with the document that has been removed and the index
 * the document has been removed from. This event can be silenced by passing false
 * as the second argument to remove.
 *
 * If user setting DocumentStore not storing the documents, then remove doc by docRef is not allowed.
 *
 * @param {String|Integer} docRef The document ref to remove from the index.
 * @param {Boolean} emitEvent Whether to emit remove events, defaults to true
 * @memberOf Index
 */
elasticlunr.Index.prototype.removeDocByRef = function (docRef, emitEvent) {
  if (!docRef) return;
  if (this.documentStore.isDocStored() === false) {
    return;
  }

  if (!this.documentStore.hasDoc(docRef)) return;
  var doc = this.documentStore.getDoc(docRef);
  this.removeDoc(doc, false);
};

/**
 * Removes a document from the index.
 * This remove operation could work even the original doc is not store in the DocumentStore.
 *
 * To make sure documents no longer show up in search results they can be
 * removed from the index using this method.
 *
 * A 'remove' event is emitted with the document that has been removed and the index
 * the document has been removed from. This event can be silenced by passing false
 * as the second argument to remove.
 *
 *
 * @param {Object} doc The document ref to remove from the index.
 * @param {Boolean} emitEvent Whether to emit remove events, defaults to true
 * @memberOf Index
 */
elasticlunr.Index.prototype.removeDoc = function (doc, emitEvent) {
  if (!doc) return;

  var emitEvent = emitEvent === undefined ? true : emitEvent;

  var docRef = doc[this._ref];
  if (!this.documentStore.hasDoc(docRef)) return;

  this.documentStore.removeDoc(docRef);

  this._fields.forEach(function (field) {
    var fieldTokens = this.pipeline.run(this.fieldTokenizer.tokenizer(doc[field], field));
    fieldTokens.forEach(function (token) {
      this.index[field].removeToken(token, docRef);
    }, this);
  }, this);

  if (emitEvent) this.eventEmitter.emit('remove', doc, this);
};

/**
 * Updates a document in the index.
 *
 * When a document contained within the index gets updated, fields changed,
 * added or removed, to make sure it correctly matched against search queries,
 * it should be updated in the index.
 *
 * This method is just a wrapper around `remove` and `add`
 *
 * An 'update' event is emitted with the document that has been updated and the index.
 * This event can be silenced by passing false as the second argument to update. Only
 * an update event will be fired, the 'add' and 'remove' events of the underlying calls
 * are silenced.
 *
 * @param {Object} doc The document to update in the index.
 * @param {Boolean} emitEvent Whether to emit update events, defaults to true
 * @see Index.prototype.remove
 * @see Index.prototype.add
 * @memberOf Index
 */
elasticlunr.Index.prototype.updateDoc = function (doc, emitEvent) {
  var emitEvent = emitEvent === undefined ? true : emitEvent;

  this.removeDocByRef(doc[this._ref], false);
  this.addDoc(doc, false);

  if (emitEvent) this.eventEmitter.emit('update', doc, this);
};

/**
 * Calculates the inverse document frequency for a token within the index of a field.
 *
 * @param {String} token The token to calculate the idf of.
 * @param {String} field The field to compute idf.
 * @see Index.prototype.idf
 * @private
 * @memberOf Index
 */
elasticlunr.Index.prototype.idf = function (term, field) {
  var cacheKey = "@" + field + '/' + term;
  if (Object.prototype.hasOwnProperty.call(this._idfCache, cacheKey)) return this._idfCache[cacheKey];

  var df = this.index[field].getDocFreq(term);
  var idf = 1 + Math.log(this.documentStore.length / (df + 1));
  this._idfCache[cacheKey] = idf;

  return idf;
};

/**
 * get fields of current index instance
 *
 * @return {Array}
 */
elasticlunr.Index.prototype.getFields = function () {
  return this._fields.slice();
};

/**
 * Searches the index using the passed query.
 * Queries should be a string, multiple words are allowed.
 *
 * If config is null, will search all fields defaultly, and lead to OR based query.
 * If config is specified, will search specified with query time boosting.
 *
 * All query tokens are passed through the same pipeline that document tokens
 * are passed through, so any language processing involved will be run on every
 * query term.
 *
 * Each query term is expanded, so that the term 'he' might be expanded to
 * 'hello' and 'help' if those terms were already included in the index.
 *
 * Matching documents are returned as an array of objects, each object contains
 * the matching document ref, as set for this index, and the similarity score
 * for this document against the query.
 *
 * @param {String} query The query to search the index with.
 * @param {JSON} userConfig The user query config, JSON format.
 * @return {Object}
 * @see Index.prototype.idf
 * @see Index.prototype.documentVector
 * @memberOf Index
 */
elasticlunr.Index.prototype.search = function (query, userConfig) {
  if (!query) return [];

  var configStr = null;
  if (userConfig != null) {
    configStr = JSON.stringify(userConfig);
  }

  var config = new elasticlunr.Configuration(configStr, this.getFields()).get();

  var queryTokens = this.pipeline.run(elasticlunr.tokenizer(query));

  var queryResults = {};

  for (var field in config) {
    var fieldSearchResults = this.fieldSearch(queryTokens, field, config);
    var fieldBoost = config[field].boost;

    for (var docRef in fieldSearchResults) {
      fieldSearchResults[docRef] = fieldSearchResults[docRef] * fieldBoost;
    }

    for (var docRef in fieldSearchResults) {
      if (docRef in queryResults) {
        queryResults[docRef] += fieldSearchResults[docRef];
      } else {
        queryResults[docRef] = fieldSearchResults[docRef];
      }
    }
  }

  var results = [];
  for (var docRef in queryResults) {
    results.push({ref: docRef, score: queryResults[docRef]});
  }

  results.sort(function (a, b) { return b.score - a.score; });
  return results;
};

/**
 * search queryTokens in specified field.
 *
 * @param {Array} queryTokens The query tokens to query in this field.
 * @param {String} field Field to query in.
 * @param {elasticlunr.Configuration} config The user query config, JSON format.
 * @return {Object}
 */
elasticlunr.Index.prototype.fieldSearch = function (queryTokens, fieldName, config) {
  var booleanType = config[fieldName].bool;
  var expand = config[fieldName].expand;
  var scores = null;
  var docTokens = {};

  queryTokens.forEach(function (token) {
    var tokens = [token];
    if (expand == true) {
      tokens = this.index[fieldName].expandToken(token);
    }
    // Consider every query token in turn. If expanded, each query token
    // corresponds to a set of tokens, which is all tokens in the
    // index matching the pattern queryToken* .
    // For the set of tokens corresponding to a query token, find and score
    // all matching documents. Store those scores in queryTokenScores,
    // keyed by docRef.
    // Then, depending on the value of booleanType, combine the scores
    // for this query token with previous scores.  If booleanType is OR,
    // then merge the scores by summing into the accumulated total, adding
    // new document scores are required (effectively a union operator).
    // If booleanType is AND, accumulate scores only if the document
    // has previously been scored by another query token (an intersection
    // operation0.
    // Furthermore, since when booleanType is AND, additional
    // query tokens can't add new documents to the result set, use the
    // current document set to limit the processing of each new query
    // token for efficiency (i.e., incremental intersection).

    var queryTokenScores = {};
    tokens.forEach(function (key) {
      var docs = this.index[fieldName].getDocs(key);
      var idf = this.idf(key, fieldName);

      if (scores && booleanType == 'AND') {
          // special case, we can rule out documents that have been
          // already been filtered out because they weren't scored
          // by previous query token passes.
          var filteredDocs = {};
          for (var docRef in scores) {
              if (docRef in docs) {
                  filteredDocs[docRef] = docs[docRef];
              }
          }
          docs = filteredDocs;
      }
      // only record appeared token for retrieved documents for the
      // original token, not for expaned token.
      // beause for doing coordNorm for a retrieved document, coordNorm only care how many
      // query token appear in that document.
      // so expanded token should not be added into docTokens, if added, this will pollute the
      // coordNorm
      if (key == token) {
        this.fieldSearchStats(docTokens, key, docs);
      }

      for (var docRef in docs) {
        var tf = this.index[fieldName].getTermFrequency(key, docRef);
        var fieldLength = this.documentStore.getFieldLength(docRef, fieldName);
        var fieldLengthNorm = 1;
        if (fieldLength != 0) {
          fieldLengthNorm = 1 / Math.sqrt(fieldLength);
        }

        var penality = 1;
        if (key != token) {
          // currently I'm not sure if this penality is enough,
          // need to do verification
          penality = (1 - (key.length - token.length) / key.length) * 0.15;
        }

        var score = tf * idf * fieldLengthNorm * penality;

        if (docRef in queryTokenScores) {
          queryTokenScores[docRef] += score;
        } else {
          queryTokenScores[docRef] = score;
        }
      }
    }, this);

    scores = this.mergeScores(scores, queryTokenScores, booleanType);
  }, this);

  scores = this.coordNorm(scores, docTokens, queryTokens.length);
  return scores;
};

/**
 * Merge the scores from one set of tokens into an accumulated score table.
 * Exact operation depends on the op parameter. If op is 'AND', then only the
 * intersection of the two score lists is retained. Otherwise, the union of
 * the two score lists is returned. For internal use only.
 *
 * @param {Object} bool accumulated scores. Should be null on first call.
 * @param {String} scores new scores to merge into accumScores.
 * @param {Object} op merge operation (should be 'AND' or 'OR').
 *
 */

elasticlunr.Index.prototype.mergeScores = function (accumScores, scores, op) {
    if (!accumScores) {
        return scores;
    }
    if (op == 'AND') {
        var intersection = {};
        for (var docRef in scores) {
            if (docRef in accumScores) {
                intersection[docRef] = accumScores[docRef] + scores[docRef];
            }
        }
        return intersection;
    } else {
        for (var docRef in scores) {
            if (docRef in accumScores) {
                accumScores[docRef] += scores[docRef];
            } else {
                accumScores[docRef] = scores[docRef];
            }
        }
        return accumScores;
    }
};


/**
 * Record the occuring query token of retrieved doc specified by doc field.
 * Only for inner user.
 *
 * @param {Object} docTokens a data structure stores which token appears in the retrieved doc.
 * @param {String} token query token
 * @param {Object} docs the retrieved documents of the query token
 *
 */
elasticlunr.Index.prototype.fieldSearchStats = function (docTokens, token, docs) {
  for (var doc in docs) {
    if (doc in docTokens) {
      docTokens[doc].push(token);
    } else {
      docTokens[doc] = [token];
    }
  }
};

/**
 * coord norm the score of a doc.
 * if a doc contain more query tokens, then the score will larger than the doc
 * contains less query tokens.
 *
 * only for inner use.
 *
 * @param {Object} results first results
 * @param {Object} docs field search results of a token
 * @param {Integer} n query token number
 * @return {Object}
 */
elasticlunr.Index.prototype.coordNorm = function (scores, docTokens, n) {
  for (var doc in scores) {
    if (!(doc in docTokens)) continue;
    var tokens = docTokens[doc].length;
    scores[doc] = scores[doc] * tokens / n;
  }

  return scores;
};

/**
 * Returns a representation of the index ready for serialisation.
 *
 * @return {Object}
 * @memberOf Index
 */
elasticlunr.Index.prototype.toJSON = function () {
  var indexJson = {};
  this._fields.forEach(function (field) {
    indexJson[field] = this.index[field].toJSON();
  }, this);

  return {
    version: elasticlunr.version,
    fields: this._fields,
    ref: this._ref,
    documentStore: this.documentStore.toJSON(),
    index: indexJson,
    pipeline: this.pipeline.toJSON()
  };
};

/**
 * Applies a plugin to the current index.
 *
 * A plugin is a function that is called with the index as its context.
 * Plugins can be used to customise or extend the behaviour the index
 * in some way. A plugin is just a function, that encapsulated the custom
 * behaviour that should be applied to the index.
 *
 * The plugin function will be called with the index as its argument, additional
 * arguments can also be passed when calling use. The function will be called
 * with the index as its context.
 *
 * Example:
 *
 *     var myPlugin = function (idx, arg1, arg2) {
 *       // `this` is the index to be extended
 *       // apply any extensions etc here.
 *     }
 *
 *     var idx = elasticlunr(function () {
 *       this.use(myPlugin, 'arg1', 'arg2')
 *     })
 *
 * @param {Function} plugin The plugin to apply.
 * @memberOf Index
 */
elasticlunr.Index.prototype.use = function (plugin) {
  var args = Array.prototype.slice.call(arguments, 1);
  args.unshift(this);
  plugin.apply(this, args);
};
/*!
 * elasticlunr.DocumentStore
 * Copyright (C) 2016 Wei Song
 */

/**
 * elasticlunr.DocumentStore is a simple key-value document store used for storing sets of tokens for
 * documents stored in index.
 *
 * elasticlunr.DocumentStore store original JSON format documents that you could build search snippet by this original JSON document.
 *
 * user could choose whether original JSON format document should be store, if no configuration then document will be stored defaultly.
 * If user care more about the index size, user could select not store JSON documents, then this will has some defects, such as user
 * could not use JSON document to generate snippets of search results.
 *
 * @param {Boolean} save If the original JSON document should be stored.
 * @constructor
 * @module
 */
elasticlunr.DocumentStore = function (save) {
  if (save === null || save === undefined) {
    this._save = true;
  } else {
    this._save = save;
  }

  this.docs = {};
  this.docInfo = {};
  this.length = 0;
};

/**
 * Loads a previously serialised document store
 *
 * @param {Object} serialisedData The serialised document store to load.
 * @return {elasticlunr.DocumentStore}
 */
elasticlunr.DocumentStore.load = function (serialisedData) {
  var store = new this;

  store.length = serialisedData.length;
  store.docs = serialisedData.docs;
  store.docInfo = serialisedData.docInfo;
  store._save = serialisedData.save;

  return store;
};

/**
 * check if current instance store the original doc
 *
 * @return {Boolean}
 */
elasticlunr.DocumentStore.prototype.isDocStored = function () {
  return this._save;
};

/**
 * Stores the given doc in the document store against the given id.
 * If docRef already exist, then update doc.
 *
 * Document is store by original JSON format, then you could use original document to generate search snippets.
 *
 * @param {Integer|String} docRef The key used to store the JSON format doc.
 * @param {Object} doc The JSON format doc.
 */
elasticlunr.DocumentStore.prototype.addDoc = function (docRef, doc) {
  if (!this.hasDoc(docRef)) this.length++;

  if (this._save === true) {
    this.docs[docRef] = clone(doc);
  } else {
    this.docs[docRef] = null;
  }
};

/**
 * Retrieves the JSON doc from the document store for a given key.
 *
 * If docRef not found, return null.
 * If user set not storing the documents, return null.
 *
 * @param {Integer|String} docRef The key to lookup and retrieve from the document store.
 * @return {Object}
 * @memberOf DocumentStore
 */
elasticlunr.DocumentStore.prototype.getDoc = function (docRef) {
  if (this.hasDoc(docRef) === false) return null;
  return this.docs[docRef];
};

/**
 * Checks whether the document store contains a key (docRef).
 *
 * @param {Integer|String} docRef The id to look up in the document store.
 * @return {Boolean}
 * @memberOf DocumentStore
 */
elasticlunr.DocumentStore.prototype.hasDoc = function (docRef) {
  return docRef in this.docs;
};

/**
 * Removes the value for a key in the document store.
 *
 * @param {Integer|String} docRef The id to remove from the document store.
 * @memberOf DocumentStore
 */
elasticlunr.DocumentStore.prototype.removeDoc = function (docRef) {
  if (!this.hasDoc(docRef)) return;

  delete this.docs[docRef];
  delete this.docInfo[docRef];
  this.length--;
};

/**
 * Add field length of a document's field tokens from pipeline results.
 * The field length of a document is used to do field length normalization even without the original JSON document stored.
 *
 * @param {Integer|String} docRef document's id or reference
 * @param {String} fieldName field name
 * @param {Integer} length field length
 */
elasticlunr.DocumentStore.prototype.addFieldLength = function (docRef, fieldName, length) {
  if (docRef === null || docRef === undefined) return;
  if (this.hasDoc(docRef) == false) return;

  if (!this.docInfo[docRef]) this.docInfo[docRef] = {};
  this.docInfo[docRef][fieldName] = length;
};

/**
 * Update field length of a document's field tokens from pipeline results.
 * The field length of a document is used to do field length normalization even without the original JSON document stored.
 *
 * @param {Integer|String} docRef document's id or reference
 * @param {String} fieldName field name
 * @param {Integer} length field length
 */
elasticlunr.DocumentStore.prototype.updateFieldLength = function (docRef, fieldName, length) {
  if (docRef === null || docRef === undefined) return;
  if (this.hasDoc(docRef) == false) return;

  this.addFieldLength(docRef, fieldName, length);
};

/**
 * get field length of a document by docRef
 *
 * @param {Integer|String} docRef document id or reference
 * @param {String} fieldName field name
 * @return {Integer} field length
 */
elasticlunr.DocumentStore.prototype.getFieldLength = function (docRef, fieldName) {
  if (docRef === null || docRef === undefined) return 0;

  if (!(docRef in this.docs)) return 0;
  if (!(fieldName in this.docInfo[docRef])) return 0;
  return this.docInfo[docRef][fieldName];
};

/**
 * Returns a JSON representation of the document store used for serialisation.
 *
 * @return {Object} JSON format
 * @memberOf DocumentStore
 */
elasticlunr.DocumentStore.prototype.toJSON = function () {
  return {
    docs: this.docs,
    docInfo: this.docInfo,
    length: this.length,
    save: this._save
  };
};

/**
 * Cloning object
 *
 * @param {Object} object in JSON format
 * @return {Object} copied object
 */
function clone(obj) {
  if (null === obj || "object" !== typeof obj) return obj;

  var copy = obj.constructor();

  for (var attr in obj) {
    if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
  }

  return copy;
}
/*!
 * elasticlunr.stemmer
 * Copyright (C) 2016 Oliver Nightingale
 * Copyright (C) 2016 Wei Song
 * Includes code from - http://tartarus.org/~martin/PorterStemmer/js.txt
 */

/**
 * elasticlunr.stemmer is an english language stemmer, this is a JavaScript
 * implementation of the PorterStemmer taken from http://tartarus.org/~martin
 *
 * @module
 * @param {String} str The string to stem
 * @return {String}
 * @see elasticlunr.Pipeline
 */
elasticlunr.stemmer = (function(){
  /*
  German includes the following accented forms,
  ä   ö   ü
  and a special letter, ß, equivalent to double s.
  The following letters are vowels:
  a   e   i   o   u   y   ä   ö   ü
  */

  function stemmer(word) {
    /*
    Put u and y between vowels into upper case
    */
    word = word.replace(/([aeiouyäöü])u([aeiouyäöü])/g, '$1U$2');
    word = word.replace(/([aeiouyäöü])y([aeiouyäöü])/g, '$1Y$2');

    /*
    and then do the following mapping,
    (a) replace ß with ss,
    */
    word = word.replace(/ß/g, 'ss');

    /*
    R1 and R2 are first set up in the standard way (see the note on R1 and R2), but then R1 is adjusted so that the region before it contains at least 3 letters.
    R1 is the region after the first non-vowel following a vowel, or is the null region at the end of the word if there is no such non-vowel.
    R2 is the region after the first non-vowel following a vowel in R1, or is the null region at the end of the word if there is no such non-vowel.
    */

    var r1Index = word.search(/[aeiouyäöü][^aeiouyäöü]/);
    var r1 = '';
    if (r1Index != -1) {
      r1Index += 2;
      r1 = word.substring(r1Index);
    }

    var r2Index = -1;
    var r2 = '';

    if (r1Index != -1) {
      r2Index = r1.search(/[aeiouyäöü][^aeiouyäöü]/);
      if (r2Index != -1) {
        r2Index += 2;
        r2 = r1.substring(r2Index);
        r2Index += r1Index;
      } else {
        r2 = '';
      }
    }

    if (r1Index != -1 && r1Index < 3) {
      r1Index = 3;
      r1 = word.substring(r1Index);
    }

    /*
    Define a valid s-ending as one of b, d, f, g, h, k, l, m, n, r or t.
    Define a valid st-ending as the same list, excluding letter r.
    */

    /*
    Do each of steps 1, 2 and 3.
    */

    /*
    Step 1:
    Search for the longest among the following suffixes,
    (a) em   ern   er
    (b) e   en   es
    (c) s (preceded by a valid s-ending)
    */
    var a1Index = word.search(/(em|ern|er)$/g);
    var b1Index = word.search(/(e|en|es)$/g);
    var c1Index = word.search(/([bdfghklmnrt]s)$/g);
    if (c1Index != -1) {
      c1Index++;
    }
    var index1 = 10000;
    var optionUsed1 = '';
    if (a1Index != -1 && a1Index < index1) {
      optionUsed1 = 'a';
      index1 = a1Index;
    }
    if (b1Index != -1 && b1Index < index1) {
      optionUsed1 = 'b';
      index1 = b1Index;
    }
    if (c1Index != -1 && c1Index < index1) {
      optionUsed1 = 'c';
      index1 = c1Index;
    }

    /*
    and delete if in R1. (Of course the letter of the valid s-ending is not necessarily in R1.) If an ending of group (b) is deleted, and the ending is preceded by niss, delete the final s.
    (For example, äckern -> äck, ackers -> acker, armes -> arm, bedürfnissen -> bedürfnis)
    */

    if (index1 != 10000 && r1Index != -1) {
      if (index1 >= r1Index) {
        word = word.substring(0, index1);
        if (optionUsed1 == 'b') {
          if (word.search(/niss$/) != -1) {
            word = word.substring(0, word.length -1);
          }
        }
      }
    }
    /*
    Step 2:
    Search for the longest among the following suffixes,
    (a) en   er   est
    (b) st (preceded by a valid st-ending, itself preceded by at least 3 letters)
    */

    var a2Index = word.search(/(en|er|est)$/g);
    var b2Index = word.search(/(.{3}[bdfghklmnt]st)$/g);
    if (b2Index != -1) {
      b2Index += 4;
    }

    var index2 = 10000;
    var optionUsed2 = '';
    if (a2Index != -1 && a2Index < index2) {
      optionUsed2 = 'a';
      index2 = a2Index;
    }
    if (b2Index != -1 && b2Index < index2) {
      optionUsed2 = 'b';
      index2 = b2Index;
    }

    /*
    and delete if in R1.
    (For example, derbsten -> derbst by step 1, and derbst -> derb by step 2, since b is a valid st-ending, and is preceded by just 3 letters)
    */

    if (index2 != 10000 && r1Index != -1) {
      if (index2 >= r1Index) {
        word = word.substring(0, index2);
      }
    }

    /*
    Step 3: d-suffixes (*)
    Search for the longest among the following suffixes, and perform the action indicated.
    end   ung
        delete if in R2
        if preceded by ig, delete if in R2 and not preceded by e
    ig   ik   isch
        delete if in R2 and not preceded by e
    lich   heit
        delete if in R2
        if preceded by er or en, delete if in R1
    keit
        delete if in R2
        if preceded by lich or ig, delete if in R2
    */

    var a3Index = word.search(/(end|ung)$/g);
    var b3Index = word.search(/[^e](ig|ik|isch)$/g);
    var c3Index = word.search(/(lich|heit)$/g);
    var d3Index = word.search(/(keit)$/g);
    if (b3Index != -1) {
      b3Index ++;
    }

    var index3 = 10000;
    var optionUsed3 = '';
    if (a3Index != -1 && a3Index < index3) {
      optionUsed3 = 'a';
      index3 = a3Index;
    }
    if (b3Index != -1 && b3Index < index3) {
      optionUsed3 = 'b';
      index3 = b3Index;
    }
    if (c3Index != -1 && c3Index < index3) {
      optionUsed3 = 'c';
      index3 = c3Index;
    }
    if (d3Index != -1 && d3Index < index3) {
      optionUsed3 = 'd';
      index3 = d3Index;
    }

    if (index3 != 10000 && r2Index != -1) {
      if (index3 >= r2Index) {
        word = word.substring(0, index3);
        var optionIndex = -1;
        var optionSubsrt = '';
        if (optionUsed3 == 'a') {
          optionIndex = word.search(/[^e](ig)$/);
          if (optionIndex != -1) {
            optionIndex++;
            if (optionIndex >= r2Index) {
              word = word.substring(0, optionIndex);
            }
          }
        } else if (optionUsed3 == 'c') {
          optionIndex = word.search(/(er|en)$/);
          if (optionIndex != -1) {
            if (optionIndex >= r1Index) {
              word = word.substring(0, optionIndex);
            }
          }
        } else if (optionUsed3 == 'd') {
          optionIndex = word.search(/(lich|ig)$/);
          if (optionIndex != -1) {
            if (optionIndex >= r2Index) {
              word = word.substring(0, optionIndex);
            }
          }
        }
      }
    }

    /*
    Finally,
    turn U and Y back into lower case, and remove the umlaut accent from a, o and u.
    */
    word = word.replace(/U/g, 'u');
    word = word.replace(/Y/g, 'y');
    word = word.replace(/ä/g, 'a');
    word = word.replace(/ö/g, 'o');
    word = word.replace(/ü/g, 'u');

    return word;
  }

  return stemmer;
})();

elasticlunr.Pipeline.registerFunction(elasticlunr.stemmer, 'stemmer');
/*!
 * elasticlunr.stopWordFilter
 * Copyright (C) 2016 Oliver Nightingale
 * Copyright (C) 2016 Wei Song
 */

/**
 * elasticlunr.stopWordFilter is an English language stop words filter, any words
 * contained in the stop word list will not be passed through the filter.
 *
 * This is intended to be used in the Pipeline. If the token does not pass the
 * filter then undefined will be returned.
 * Currently this StopwordFilter using dictionary to do O(1) time complexity stop word filtering.
 *
 * @module
 * @param {String} token The token to pass through the filter
 * @return {String}
 * @see elasticlunr.Pipeline
 */
elasticlunr.stopWordFilter = function (token) {
  if (token && elasticlunr.stopWordFilter.stopWords[token] !== true) {
    return token;
  }
};

/**
 * Remove predefined stop words
 * if user want to use customized stop words, user could use this function to delete
 * all predefined stopwords.
 *
 * @return {null}
 */
elasticlunr.clearStopWords = function () {
  elasticlunr.stopWordFilter.stopWords = {};
};

/**
 * Add customized stop words
 * user could use this function to add customized stop words
 *
 * @params {Array} words customized stop words
 * @return {null}
 */
elasticlunr.addStopWords = function (words) {
  if (words == null || Array.isArray(words) === false) return;

  words.forEach(function (word) {
    elasticlunr.stopWordFilter.stopWords[word] = true;
  }, this);
};

/**
 * Reset to default stop words
 * user could use this function to restore default stop words
 *
 * @return {null}
 */
elasticlunr.resetStopWords = function () {
  elasticlunr.stopWordFilter.stopWords = elasticlunr.defaultStopWords;
};

elasticlunr.defaultStopWords = {
  "": true,
  "aber": true,
  "alle": true,
  "allem": true,
  "allen": true,
  "aller": true,
  "alles": true,
  "als": true,
  "also": true,
  "am": true,
  "an": true,
  "ander": true,
  "andere": true,
  "anderem": true,
  "anderen": true,
  "anderer": true,
  "anderes": true,
  "anderm": true,
  "andern": true,
  "anderr": true,
  "anders": true,
  "auch": true,
  "auf": true,
  "aus": true,
  "bei": true,
  "bin": true,
  "bis": true,
  "bist": true,
  "da": true,
  "damit": true,
  "dann": true,
  "der": true,
  "den": true,
  "des": true,
  "dem": true,
  "die": true,
  "das": true,
  "daß": true,
  "derselbe": true,
  "derselben": true,
  "denselben": true,
  "desselben": true,
  "demselben": true,
  "dieselbe": true,
  "dieselben": true,
  "dasselbe": true,
  "dazu": true,
  "dein": true,
  "deine": true,
  "deinem": true,
  "deinen": true,
  "deiner": true,
  "deines": true,
  "denn": true,
  "derer": true,
  "dessen": true,
  "dich": true,
  "dir": true,
  "du": true,
  "dies": true,
  "diese": true,
  "diesem": true,
  "diesen": true,
  "dieser": true,
  "dieses": true,
  "doch": true,
  "dort": true,
  "durch": true,
  "ein": true,
  "eine": true,
  "einem": true,
  "einen": true,
  "einer": true,
  "eines": true,
  "einig": true,
  "einige": true,
  "einigem": true,
  "einigen": true,
  "einiger": true,
  "einiges": true,
  "einmal": true,
  "er": true,
  "ihn": true,
  "ihm": true,
  "es": true,
  "etwas": true,
  "euer": true,
  "eure": true,
  "eurem": true,
  "euren": true,
  "eurer": true,
  "eures": true,
  "für": true,
  "gegen": true,
  "gewesen": true,
  "hab": true,
  "habe": true,
  "haben": true,
  "hat": true,
  "hatte": true,
  "hatten": true,
  "hier": true,
  "hin": true,
  "hinter": true,
  "ich": true,
  "mich": true,
  "mir": true,
  "ihr": true,
  "ihre": true,
  "ihrem": true,
  "ihren": true,
  "ihrer": true,
  "ihres": true,
  "euch": true,
  "im": true,
  "in": true,
  "indem": true,
  "ins": true,
  "ist": true,
  "jede": true,
  "jedem": true,
  "jeden": true,
  "jeder": true,
  "jedes": true,
  "jene": true,
  "jenem": true,
  "jenen": true,
  "jener": true,
  "jenes": true,
  "jetzt": true,
  "kann": true,
  "kein": true,
  "keine": true,
  "keinem": true,
  "keinen": true,
  "keiner": true,
  "keines": true,
  "können": true,
  "könnte": true,
  "machen": true,
  "man": true,
  "manche": true,
  "manchem": true,
  "manchen": true,
  "mancher": true,
  "manches": true,
  "mein": true,
  "meine": true,
  "meinem": true,
  "meinen": true,
  "meiner": true,
  "meines": true,
  "mit": true,
  "muss": true,
  "musste": true,
  "nach": true,
  "nicht": true,
  "nichts": true,
  "noch": true,
  "nun": true,
  "nur": true,
  "ob": true,
  "oder": true,
  "ohne": true,
  "sehr": true,
  "sein": true,
  "seine": true,
  "seinem": true,
  "seinen": true,
  "seiner": true,
  "seines": true,
  "selbst": true,
  "sich": true,
  "sie": true,
  "ihnen": true,
  "sind": true,
  "so": true,
  "solche": true,
  "solchem": true,
  "solchen": true,
  "solcher": true,
  "solches": true,
  "soll": true,
  "sollte": true,
  "sondern": true,
  "sonst": true,
  "über": true,
  "um": true,
  "und": true,
  "uns": true,
  "unse": true,
  "unsem": true,
  "unsen": true,
  "unser": true,
  "unses": true,
  "unter": true,
  "viel": true,
  "vom": true,
  "von": true,
  "vor": true,
  "während": true,
  "war": true,
  "waren": true,
  "warst": true,
  "was": true,
  "weg": true,
  "weil": true,
  "weiter": true,
  "welche": true,
  "welchem": true,
  "welchen": true,
  "welcher": true,
  "welches": true,
  "wenn": true,
  "werde": true,
  "werden": true,
  "wie": true,
  "wieder": true,
  "will": true,
  "wir": true,
  "wird": true,
  "wirst": true,
  "wo": true,
  "wollen": true,
  "wollte": true,
  "würde": true,
  "würden": true,
  "zu": true,
  "zum": true,
  "zur": true,
  "zwar": true,
  "zwischen": true
};

elasticlunr.stopWordFilter.stopWords = elasticlunr.defaultStopWords;

elasticlunr.Pipeline.registerFunction(elasticlunr.stopWordFilter, 'stopWordFilter');
/*!
 * elasticlunr.trimmer
 * Copyright (C) 2016 Oliver Nightingale
 * Copyright (C) 2016 Oliver Nightingale
 */

/**
 * elasticlunr.trimmer is a pipeline function for trimming non word
 * characters from the begining and end of tokens before they
 * enter the index.
 *
 * This implementation may not work correctly for non latin
 * characters and should either be removed or adapted for use
 * with languages with non-latin characters.
 *
 * @module
 * @param {String} token The token to pass through the filter
 * @return {String}
 * @see elasticlunr.Pipeline
 */
elasticlunr.trimmer = function (token) {
  if (token === null || token === undefined) {
    throw new Error('token should not be undefined');
  }

  return token
    .replace(/^\W+/, '')
    .replace(/\W+$/, '');
};

elasticlunr.Pipeline.registerFunction(elasticlunr.trimmer, 'trimmer');
/*!
 * elasticlunr.InvertedIndex
 * Copyright (C) 2016 Wei Song
 * Includes code from - http://tartarus.org/~martin/PorterStemmer/js.txt
 */

/**
 * elasticlunr.InvertedIndex is used for efficiently storing and
 * lookup of documents that contain a given token.
 *
 * @constructor
 */
elasticlunr.InvertedIndex = function () {
  this.root = { docs: {}, df: 0 };
};

/**
 * Loads a previously serialised inverted index.
 *
 * @param {Object} serialisedData The serialised inverted index to load.
 * @return {elasticlunr.InvertedIndex}
 */
elasticlunr.InvertedIndex.load = function (serialisedData) {
  var idx = new this;
  idx.root = serialisedData.root;

  return idx;
};

/**
 * Adds a {token: tokenInfo} pair to the inverted index.
 * If the token already exist, then update the tokenInfo.
 *
 * tokenInfo format: { ref: 1, tf: 2}
 * tokenInfor should contains the document's ref and the tf(token frequency) of that token in
 * the document.
 *
 * By default this function starts at the root of the current inverted index, however
 * it can start at any node of the inverted index if required.
 *
 * @param {String} token 
 * @param {Object} tokenInfo format: { ref: 1, tf: 2}
 * @param {Object} root An optional node at which to start looking for the
 * correct place to enter the doc, by default the root of this elasticlunr.InvertedIndex
 * is used.
 * @memberOf InvertedIndex
 */
elasticlunr.InvertedIndex.prototype.addToken = function (token, tokenInfo, root) {
  var root = root || this.root,
      idx = 0;

  while (idx <= token.length - 1) {
    var key = token[idx];

    if (!(key in root)) root[key] = {docs: {}, df: 0};
    idx += 1;
    root = root[key];
  }

  var docRef = tokenInfo.ref;
  if (!root.docs[docRef]) {
    // if this doc not exist, then add this doc
    root.docs[docRef] = {tf: tokenInfo.tf};
    root.df += 1;
  } else {
    // if this doc already exist, then update tokenInfo
    root.docs[docRef] = {tf: tokenInfo.tf};
  }
};

/**
 * Checks whether a token is in this elasticlunr.InvertedIndex.
 * 
 *
 * @param {String} token The token to be checked
 * @return {Boolean}
 * @memberOf InvertedIndex
 */
elasticlunr.InvertedIndex.prototype.hasToken = function (token) {
  if (!token) return false;

  var node = this.root;

  for (var i = 0; i < token.length; i++) {
    if (!node[token[i]]) return false;
    node = node[token[i]];
  }

  return true;
};

/**
 * Retrieve a node from the inverted index for a given token.
 * If token not found in this InvertedIndex, return null.
 * 
 *
 * @param {String} token The token to get the node for.
 * @return {Object}
 * @see InvertedIndex.prototype.get
 * @memberOf InvertedIndex
 */
elasticlunr.InvertedIndex.prototype.getNode = function (token) {
  if (!token) return null;

  var node = this.root;

  for (var i = 0; i < token.length; i++) {
    if (!node[token[i]]) return null;
    node = node[token[i]];
  }

  return node;
};

/**
 * Retrieve the documents of a given token.
 * If token not found, return {}.
 *
 *
 * @param {String} token The token to get the documents for.
 * @return {Object}
 * @memberOf InvertedIndex
 */
elasticlunr.InvertedIndex.prototype.getDocs = function (token) {
  var node = this.getNode(token);
  if (node == null) {
    return {};
  }

  return node.docs;
};

/**
 * Retrieve term frequency of given token in given docRef.
 * If token or docRef not found, return 0.
 *
 *
 * @param {String} token The token to get the documents for.
 * @param {String|Integer} docRef
 * @return {Integer}
 * @memberOf InvertedIndex
 */
elasticlunr.InvertedIndex.prototype.getTermFrequency = function (token, docRef) {
  var node = this.getNode(token);

  if (node == null) {
    return 0;
  }

  if (!(docRef in node.docs)) {
    return 0;
  }

  return node.docs[docRef].tf;
};

/**
 * Retrieve the document frequency of given token.
 * If token not found, return 0.
 *
 *
 * @param {String} token The token to get the documents for.
 * @return {Object}
 * @memberOf InvertedIndex
 */
elasticlunr.InvertedIndex.prototype.getDocFreq = function (token) {
  var node = this.getNode(token);

  if (node == null) {
    return 0;
  }

  return node.df;
};

/**
 * Remove the document identified by document's ref from the token in the inverted index.
 *
 *
 * @param {String} token Remove the document from which token.
 * @param {String} ref The ref of the document to remove from given token.
 * @memberOf InvertedIndex
 */
elasticlunr.InvertedIndex.prototype.removeToken = function (token, ref) {
  if (!token) return;
  var node = this.getNode(token);

  if (node == null) return;

  if (ref in node.docs) {
    delete node.docs[ref];
    node.df -= 1;
  }
};

/**
 * Find all the possible suffixes of given token using tokens currently in the inverted index.
 * If token not found, return empty Array.
 *
 * @param {String} token The token to expand.
 * @return {Array}
 * @memberOf InvertedIndex
 */
elasticlunr.InvertedIndex.prototype.expandToken = function (token, memo, root) {
  if (token == null || token == '') return [];
  var memo = memo || [];

  if (root == void 0) {
    root = this.getNode(token);
    if (root == null) return memo;
  }

  if (root.df > 0) memo.push(token);

  for (var key in root) {
    if (key === 'docs') continue;
    if (key === 'df') continue;
    this.expandToken(token + key, memo, root[key]);
  }

  return memo;
};

/**
 * Returns a representation of the inverted index ready for serialisation.
 *
 * @return {Object}
 * @memberOf InvertedIndex
 */
elasticlunr.InvertedIndex.prototype.toJSON = function () {
  return {
    root: this.root
  };
};

/*!
 * elasticlunr.Configuration
 * Copyright (C) 2016 Wei Song
 */
 
 /** 
  * elasticlunr.Configuration is used to analyze the user search configuration.
  * 
  * By elasticlunr.Configuration user could set query-time boosting, boolean model in each field.
  * 
  * Currently configuration supports:
  * 1. query-time boosting, user could set how to boost each field.
  * 2. boolean model chosing, user could choose which boolean model to use for each field.
  * 3. token expandation, user could set token expand to True to improve Recall. Default is False.
  * 
  * Query time boosting must be configured by field category, "boolean" model could be configured 
  * by both field category or globally as the following example. Field configuration for "boolean"
  * will overwrite global configuration.
  * Token expand could be configured both by field category or golbally. Local field configuration will
  * overwrite global configuration.
  * 
  * configuration example:
  * {
  *   fields:{ 
  *     title: {boost: 2},
  *     body: {boost: 1}
  *   },
  *   bool: "OR"
  * }
  * 
  * "bool" field configuation overwrite global configuation example:
  * {
  *   fields:{ 
  *     title: {boost: 2, bool: "AND"},
  *     body: {boost: 1}
  *   },
  *   bool: "OR"
  * }
  * 
  * "expand" example:
  * {
  *   fields:{ 
  *     title: {boost: 2, bool: "AND"},
  *     body: {boost: 1}
  *   },
  *   bool: "OR",
  *   expand: true
  * }
  * 
  * "expand" example for field category:
  * {
  *   fields:{ 
  *     title: {boost: 2, bool: "AND", expand: true},
  *     body: {boost: 1}
  *   },
  *   bool: "OR"
  * }
  * 
  * then, user could search with configuration to do query-time boosting.
  * idx.search('oracle database', {fields: {title: {boost: 2}, body: {boost: 1}}});
  * 
  * 
  * @constructor
  * 
  * @param {String} config user configuration
  * @param {Array} fields fields of index instance
  * @module
  */
elasticlunr.Configuration = function (config, fields) {
  var config = config || '';

  if (fields == undefined || fields == null) {
    throw new Error('fields should not be null');
  }

  this.config = {};

  var userConfig;
  try {
    userConfig = JSON.parse(config);
    this.buildUserConfig(userConfig, fields);
  } catch (error) {
    elasticlunr.utils.warn('user configuration parse failed, will use default configuration');
    this.buildDefaultConfig(fields);
  }
};

/**
 * Build default search configuration.
 * 
 * @param {Array} fields fields of index instance
 */
elasticlunr.Configuration.prototype.buildDefaultConfig = function (fields) {
  this.reset();
  fields.forEach(function (field) {
    this.config[field] = {
      boost: 1,
      bool: "OR",
      expand: false
    };
  }, this);
};

/**
 * Build user configuration.
 * 
 * @param {JSON} config User JSON configuratoin
 * @param {Array} fields fields of index instance
 */
elasticlunr.Configuration.prototype.buildUserConfig = function (config, fields) {
  var global_bool = "OR";
  var global_expand = false;

  this.reset();
  if ('bool' in config) {
    global_bool = config['bool'] || global_bool;
  }

  if ('expand' in config) {
    global_expand = config['expand'] || global_expand;
  }

  if ('fields' in config) {
    for (var field in config['fields']) {
      if (fields.indexOf(field) > -1) {
        var field_config = config['fields'][field];
        var field_expand = global_expand;
        if (field_config.expand != undefined) {
          field_expand = field_config.expand;
        }

        this.config[field] = {
          boost: field_config.boost || 1,
          bool: field_config.bool || global_bool,
          expand: field_expand
        };
      } else {
        elasticlunr.utils.warn('field name in user configuration not found in index instance fields');
      }
    }
  } else {
    this.addAllFields2UserConfig(global_bool, global_expand, fields);
  }
};

/**
 * Add all fields to user search configuration.
 * 
 * @param {String} bool Boolean model
 * @param {String} expand Expand model
 * @param {Array} fields fields of index instance
 */
elasticlunr.Configuration.prototype.addAllFields2UserConfig = function (bool, expand, fields) {
  fields.forEach(function (field) {
    this.config[field] = {
      boost: 1,
      bool: bool,
      expand: expand
    };
  }, this);
};

/**
 * get current user configuration
 */
elasticlunr.Configuration.prototype.get = function () {
  return this.config;
};

/**
 * reset user search configuration.
 */
elasticlunr.Configuration.prototype.reset = function () {
  this.config = {};
};

  /**
   * export the module via AMD, CommonJS or as a browser global
   * Export code from https://github.com/umdjs/umd/blob/master/returnExports.js
   */
  ;(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
      // AMD. Register as an anonymous module.
      define(factory)
    } else if (typeof exports === 'object') {
      /**
       * Node. Does not work with strict CommonJS, but
       * only CommonJS-like enviroments that support module.exports,
       * like Node.
       */
      module.exports = factory()
    } else {
      // Browser globals (root is window)
      root.elasticlunr = factory()
    }
  }(this, function () {
    /**
     * Just return a value to define the module export.
     * This example returns an object, but the module
     * can return a function as the exported value.
     */
    return elasticlunr
  }))
})();
