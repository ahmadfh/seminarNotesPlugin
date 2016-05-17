'use strict';

(function (angular, buildfire, window) {
  angular.module('seminarNotesPluginWidget')
    .controller('WidgetItemCtrl', ['$scope', 'DataStore', 'TAG_NAMES', 'LAYOUTS', '$routeParams', '$sce', '$rootScope', 'Buildfire', 'ViewStack', 'UserData',
      function ($scope, DataStore, TAG_NAMES, LAYOUTS, $routeParams, $sce, $rootScope, Buildfire, ViewStack, UserData) {
        var WidgetItem = this;
        $scope.toggleNoteList = 0;
        $scope.toggleNoteAdd = 0;
        $scope.showNoteList = 1;
        $scope.showNoteAdd = 1;
        $scope.showNoteDescription=false;
        WidgetItem.swiped = [];
        var searchOptions = {};
        var noteSearchOptions = {};
        WidgetItem.itemNote = {
          noteTitle: "",
          noteDescription: "",
          itemID: "",
          itemTitle: "",
          dateAdded: ""
        };
        WidgetItem.currentLoggedInUser = null;
        WidgetItem.Note = {
          noteTitle: "",
          noteDescription: ""
        };
        WidgetItem.ItemNoteList = {};

        WidgetItem.swipeToDeleteNote = function (e, i, toggle) {
          toggle ? WidgetItem.swiped[i] = true : WidgetItem.swiped[i] = false;
        };
        var currentView = ViewStack.getCurrentView();

        WidgetItem.safeHtml = function (html) {
          if (html) {
            return $sce.trustAsHtml(html);
          }
        };

        var getEventDetails = function () {
          Buildfire.spinner.show();
          var success = function (result) {

              Buildfire.spinner.hide();
              WidgetItem.item = result;
              console.log("========ingeteventdetails", result);

              if (!WidgetItem.item.data.itemListBgImage) {
                $rootScope.itemDetailbackgroundImage = "";
              } else {
                $rootScope.itemDetailbackgroundImage = WidgetItem.item.data.itemListBgImage;
              }
            }
            , error = function (err) {
              Buildfire.spinner.hide();
              console.error('Error In Fetching Event', err);
            };

          console.log(">>>>>>>>>>", currentView);
          if (currentView.params && currentView.params.itemId) {
            DataStore.getById(currentView.params.itemId, TAG_NAMES.SEMINAR_ITEMS).then(success, error);
          }
        };

        /**
         * Check for current logged in user, if not show ogin screen
         */
        buildfire.auth.getCurrentUser(function (err, user) {
          console.log("===========LoggedInUser", user);
          if (user) {
            WidgetItem.currentLoggedInUser = user;
          }
        });

        /**
         * Method to open buildfire auth login pop up and allow user to login using credentials.
         */
        WidgetItem.openLogin = function () {
          buildfire.auth.login({}, function () {

          });
        };

        var loginCallback = function () {
          buildfire.auth.getCurrentUser(function (err, user) {
            console.log("=========User", user);
            if (user) {
              WidgetItem.currentLoggedInUser = user;
              $scope.$apply();
            }
          });
        };

        buildfire.auth.onLogin(loginCallback);

        /*
         * Fetch user's data from datastore
         */
        var init = function () {
          Buildfire.spinner.show();
          var success = function (result) {
              Buildfire.spinner.hide();
              WidgetItem.data = result.data;
              if (!WidgetItem.data.design)
                WidgetItem.data.design = {};
              getEventDetails();
                WidgetItem.getBookmarkedItems();
            }
            , error = function (err) {
              Buildfire.spinner.hide();
              console.error('Error while getting data', err);
            };
          DataStore.get(TAG_NAMES.SEMINAR_INFO).then(success, error);
        };

        init();

        WidgetItem.showHideNoteList = function () {
          $scope.showNoteDescription=false;
          if (WidgetItem.currentLoggedInUser) {
            WidgetItem.getNoteList();
            if ($scope.toggleNoteList && !$scope.toggleNoteAdd) {
              $scope.toggleNoteList = 0;
            } else {
              $scope.toggleNoteList = 1;
              $scope.showNoteList = 1;
              $scope.showNoteAdd = 0;
            }
            if ($scope.toggleNoteList && $scope.toggleNoteAdd) {
              $scope.toggleNoteList = 0;
              $scope.toggleNoteAdd = 0
            }
          }
          else{
            WidgetItem.openLogin();
          }
        };

        WidgetItem.showNoteList = function(){
          $scope.showNoteDescription=false;
        }
        WidgetItem.showHideAddNote = function () {
          $scope.showNoteDescription=false;
          if (WidgetItem.currentLoggedInUser) {
            if ($scope.toggleNoteAdd && !$scope.toggleNoteList) {
              $scope.toggleNoteAdd = 0
            } else {
              $scope.toggleNoteAdd = 1;
              $scope.showNoteAdd = 1;
              $scope.showNoteList = 0;
            }
            if ($scope.toggleNoteList && $scope.toggleNoteAdd) {
              $scope.toggleNoteList = 0;
              $scope.toggleNoteAdd = 0
            }
          }else{
            WidgetItem.openLogin();
          }

        };

        WidgetItem.addNoteToItem = function (itemId) {
          Buildfire.spinner.show();
          WidgetItem.itemNote = {
            noteTitle: WidgetItem.Note.noteTitle,
            noteDescription: WidgetItem.Note.noteDescription,
            itemID: itemId,
            itemTitle: WidgetItem.item.data.title,
            dateAdded: new Date()
          };
          var successItem = function (result) {
            Buildfire.spinner.hide();
            console.log("Inserted Item Note", result);
            $scope.isClicked = itemId;
            $scope.toggleNoteAdd = 0;
          }, errorItem = function () {
            Buildfire.spinner.hide();
            return console.error('There was a problem saving your data');
          };
          UserData.insert(WidgetItem.itemNote, TAG_NAMES.SEMINAR_NOTES).then(successItem, errorItem);
        };

        /**
         * This event listener is bound for "Carousel:LOADED" event broadcast
         */
        $rootScope.$on("Carousel2:LOADED", function () {
          //  WidgetItem.view = null;
          if( WidgetItem.view)
          WidgetItem.view._destroySlider();
          if (!WidgetItem.view) {
            WidgetItem.view = new Buildfire.components.carousel.view("#carousel2", []);
          }
          if (WidgetItem.item.data && WidgetItem.item.data.carouselImages) {
            WidgetItem.view.loadItems(WidgetItem.item.data.carouselImages);
          } else {
            WidgetItem.view.loadItems([]);
          }
        });

        WidgetItem.getNoteList = function () {
          Buildfire.spinner.show();
          console.log("============itemIDDDD", WidgetItem.item.id)
          searchOptions.filter = {"$or": [{"$json.itemID": {"$eq": WidgetItem.item.id}}]};
          var err = function (error) {
            Buildfire.spinner.hide();
            console.log("============ There is an error in getting data", error);
          }, result = function (result) {
            Buildfire.spinner.hide();
            console.log("===========searchItem", result);
            WidgetItem.ItemNoteList = result;

            if (currentView.params && currentView.params.noteId) {
              //
              //console.log("============>>",currentView.params.noteId)
              //WidgetItem.getNoteDetail(currentView.params.noteId);
              //$scope.toggleNoteList = true;
              //$scope.showNoteDescription=true;
              //$scope.showNoteList = true;
            }
          //  currentView.params.noteId = null;
          }
          UserData.search(searchOptions, TAG_NAMES.SEMINAR_NOTES).then(result, err);
        };

        WidgetItem.openLinks = function (actionItems) {
          if (actionItems && actionItems.length) {
            var options = {};
            var callback = function (error, result) {
              if (error) {
                console.error('Error:', error);
              }
            };
            buildfire.actionItems.list(actionItems, options, callback);
          }
        };

        WidgetItem.getBookmarkedItems = function () {
          Buildfire.spinner.show();
          var err = function(error){
            Buildfire.spinner.hide();
            console.log("============ There is an error in getting data", error);
          },result = function(result){
            Buildfire.spinner.hide();
            console.log("===========searchinItem",result);
            WidgetItem.bookmarks = result;
            WidgetItem.getBookmarks();
          };
          UserData.search({}, TAG_NAMES.SEMINAR_BOOKMARKS).then(result, err);
        };

        WidgetItem.getNoteDetail = function (noteId) {
          $scope.showNoteDescription=true;
          WidgetItem.ItemNoteList.map(function(obj){
            var rObj = {};
            if(obj.id==noteId){
              rObj = obj;
              WidgetItem.noteDetail = rObj;
            }
          });
          console.log("==================...",WidgetItem.noteDetail)
        };

        WidgetItem.addToBookmark = function(itemId){
          Buildfire.spinner.show();
          WidgetItem.bookmarkItem = {
            data:{
              itemIds: itemId
            }
          }
          var successItem = function (result) {
            Buildfire.spinner.hide();
            WidgetItem.item.isBookmarked = true;
            console.log("Inserted", result);
            $scope.isClicked = itemId;
            WidgetItem.getBookmarks();
          }, errorItem = function () {
            Buildfire.spinner.hide();
            return console.error('There was a problem saving your data');
          };
          UserData.insert(WidgetItem.bookmarkItem.data, TAG_NAMES.SEMINAR_BOOKMARKS).then(successItem, errorItem);
        };
        WidgetItem.getBookmarks = function(){
          if(WidgetItem.item){
            for (var bookmark in WidgetItem.bookmarks)  {
              if(WidgetItem.bookmarks[bookmark].data.itemIds == WidgetItem.item.id){
                WidgetItem.item.isBookmarked = true;
              }
            }
            console.log("============initemGetBookmarks", WidgetItem.item);
            $scope.isFetchedAllData = true;
          }
        };
        var onUpdateCallback = function (event) {
          setTimeout(function () {
            $scope.$digest();
            if (event && event.tag) {
              console.log("_____________________________", event);
              switch (event.tag) {
                case TAG_NAMES.SEMINAR_INFO:
                  WidgetItem.data = event.data;
                  if (!WidgetItem.data.design)
                    WidgetItem.data.design = {};
                  break;
                case TAG_NAMES.SEMINAR_ITEMS:
                  WidgetItem.item.data = event.data;
                  if (WidgetItem.view) {
                    WidgetItem.view.loadItems(WidgetItem.item.data.carouselImages);
                  }

                  if (!WidgetItem.item.data.itemListBgImage) {
                    $rootScope.itemDetailbackgroundImage = "";
                  } else {
                    $rootScope.itemDetailbackgroundImage = WidgetItem.item.data.itemListBgImage;
                  }
                  break;
              }
              $scope.$digest();
              $rootScope.$apply();
            }
          }, 0);
        };
        DataStore.onUpdate().then(null, null, onUpdateCallback);

      }]);
})(window.angular, window.buildfire, window);