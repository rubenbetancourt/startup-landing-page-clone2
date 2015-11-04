// Generated by CoffeeScript 1.10.0
define(['jquery', 'external/underscore', 'modules/clean/notserver', 'modules/clean/revisions/file_revisions_iterator'], function($j, $u, arg, FileRevisionsIterator) {
  var FileWatcher, FileWatcherSubscription, NotClients, exports, getNotClient, getWatcher, watchers;
  NotClients = arg.NotClients;
  watchers = {};
  getNotClient = function(user) {
    return NotClients[user.id];
  };
  getWatcher = function(file, user) {
    var fqPath, userId;
    fqPath = file.fq_path;
    userId = user.id;
    if (!(fqPath in watchers)) {
      watchers[fqPath] = {};
    }
    if (!(userId in watchers[fqPath])) {
      watchers[fqPath][userId] = new FileWatcher(file, user);
    }
    return watchers[fqPath][userId];
  };
  FileWatcher = (function() {
    function FileWatcher(file1, user1) {
      this.file = file1;
      this.user = user1;
      this.subscriptions = [];
      this.notClient = getNotClient(this.user);
      this.notClientHandlerId = this.notClient.subscribe_sfj({
        name: 'FileWatcher',
        handler: this.checkForUpdates.bind(this)
      });
    }

    FileWatcher.prototype.subscribe = function(subscription) {
      return this.subscriptions.push(subscription);
    };

    FileWatcher.prototype.unsubscribe = function(subscription) {
      return this.subscriptions = $u.reject(this.subscriptions, subscription);
    };

    FileWatcher.prototype.checkForUpdates = function() {
      var iterator, latest, notifySubscribers;
      if (this.subscriptions.length === 0) {
        return;
      }
      iterator = new FileRevisionsIterator(this.file.fq_path, this.user.id);
      latest = iterator.next();
      latest.done((function(_this) {
        return function(data) {
          var latestRevision, latestSjid;
          latestRevision = data.revisions[0];
          latestSjid = latestRevision.filePreview.sjid;
          notifySubscribers(latestSjid);
          return _this.notClient.handler_success(_this.notClientHandlerId, {
            ns_map: {}
          });
        };
      })(this));
      latest.fail((function(_this) {
        return function() {
          return _this.notClient.handler_failure(_this.notClientHandlerId);
        };
      })(this));
      return notifySubscribers = (function(_this) {
        return function(latestSjid) {
          var i, len, ref, results, subscription;
          ref = _this.subscriptions;
          results = [];
          for (i = 0, len = ref.length; i < len; i++) {
            subscription = ref[i];
            results.push((function(subscription) {
              return setTimeout(function() {
                if (latestSjid > subscription.latestSjid) {
                  return subscription.notify(latestSjid);
                }
              }, 0);
            })(subscription));
          }
          return results;
        };
      })(this);
    };

    return FileWatcher;

  })();
  FileWatcherSubscription = (function() {
    function FileWatcherSubscription(file1, user1, callback1) {
      this.file = file1;
      this.user = user1;
      this.callback = callback1;
      this.latestSjid = this.file.sjid;
    }

    FileWatcherSubscription.prototype.notify = function(latestSjid) {
      this.latestSjid = latestSjid;
      return this.callback();
    };

    FileWatcherSubscription.prototype.cancel = function() {
      var watcher;
      watcher = getWatcher(this.file, this.user);
      return watcher.unsubscribe(this);
    };

    return FileWatcherSubscription;

  })();
  exports = {};
  exports.subscribe = function(file, user, callback) {
    var subscription, watcher;
    if (!getNotClient(user)) {
      return;
    }
    subscription = new FileWatcherSubscription(file, user, callback);
    watcher = getWatcher(file, user);
    watcher.subscribe(subscription);
    return subscription;
  };
  exports._reset = function() {
    return watchers = {};
  };
  return exports;
});

//# sourceMappingURL=file_watcher.js.map
