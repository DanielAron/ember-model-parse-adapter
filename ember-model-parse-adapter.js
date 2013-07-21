function classToEndpoint(klass) {
  return klass.toString().split('.')[1];
}

Ember.ParseAdapter = Ember.Adapter.extend({
  find: function(record, id) {
    var endpoint = classToEndpoint(record.constructor);

    return this._ajax(endpoint + "/" + id).then(function(json) {
      record.load(id, json);
    }, function(err) {
      console.log("Error occurred:", err);
    });
  },

  findQuery: function(klass, records, params) {
    var url = classToEndpoint(klass),
        query = encodeURIComponent("where=" + JSON.stringify(params)),
        self = this;

    return this._ajax([ url, query ].join("?")).then(function(data) {
      self.didFindQuery(klass, records, params, data);
    });
  },

  didFindQuery: function(klass, records, params, data) {
      records.load(klass, data['results']);
  },

  findAll: function(klass, records) {
    var endpoint = classToEndpoint(klass);

    return this._ajax(endpoint).then(function(json) {
      records.load(klass, json.results);
    }, function(err) {
      console.log("Error occurred:", err);
    });
  },

  createRecord: function(record) {
    var endpoint = classToEndpoint(record.constructor),
      primaryKey = Ember.get(record.constructor, 'primaryKey'),
      self = this;

    return this._ajax(endpoint, record.toJSON(), "POST").then(function(data) {
      self.didCreateRecord(record, data);
    });
  },

  didCreateRecord: function(record, data) {
    var rootKey = Ember.get(record.constructor, 'rootKey'),
        primaryKey = Ember.get(record.constructor, 'primaryKey'),
        originalData = record.toJSON(),
        dataToLoad = rootKey ? data[rootKey] : data;

    Ember.merge(originalData, dataToLoad);
console.log("created", originalData);
    record.load(dataToLoad[primaryKey], originalData);
    record.didCreateRecord();
  },

  saveRecord: function(record) {
    var primaryKey = Ember.get(record.constructor, 'primaryKey'),
        id = Ember.get(record, primaryKey),
        url = [ classToEndpoint(record.constructor), id ].join("/"),
        self = this;

    return this._ajax(url, record.toJSON(), "PUT").then(function(data) {  // TODO: Some APIs may or may not return data
      self.didSaveRecord(record, data);
    });
  },

  deleteRecord: function (record) {
    var primaryKey = Ember.get(record.constructor, 'primaryKey'),
        url = [ classToEndpoint(record.constructor), Ember.get(record, primaryKey) ].join("/");

    return this._ajax(url, record.toJSON(), "DELETE").then(function() { 
      record.didDeleteRecord();
    });
  },

  _ajax: function (urlSuffix, params, method) {
    var url = "https://api.parse.com/1/classes/" + urlSuffix,
      data = {
        contentType: "application/json",
        dataType: "json",
        headers: {
          "X-Parse-Application-Id": "t1OLK47Xc6GGlU6SfE3UqSq3ajLGBgCGiiofGkrS",
          "X-Parse-REST-API-Key": "e5iWAr2rduftKSFgTU4fyO9jtMUxreTAi2J9WSIX"
        },
        data: JSON.stringify(params),
        type: method || "GET"
      };

    return $.ajax(url, data);
  }
});