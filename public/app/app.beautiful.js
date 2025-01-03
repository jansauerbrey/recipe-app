angular.module("app", [ "app.auth", "app.recipes", "app.schedules", "app.shopitems", "app.units", "app.ingredients", "app.dishtypes", "app.admin", "app.alert", "ui.router", "ngAnimate", "ngResource", "ngStorage", "ui.bootstrap", "ngTagsInput", "angular.filter", "ngAside", "angular-spinkit", "gm.datepickerMultiSelect", "720kb.socialshare", "as.sortable" ]).constant("BASE_URI", "https://www.rezept-planer.de/").factory("navigationMenu", [ "$state", function(e) {
    var t = [], n = e.get();
    return angular.forEach(n, function(e) {
        e.data && e.data.name && t.push({
            path: e.url,
            name: e.name,
            label: e.data.name,
            icon: e.data.icon ? e.data.icon : null,
            panelright: e.data.panelright ? e.data.panelright : !1,
            requiresLogin: e.data.requiresLogin ? e.data.requiresLogin : !1,
            requiredPermissions: e.data.requiredPermissions ? e.data.requiredPermissions.join() : void 0
        });
    }), {
        states: t
    };
} ]).factory("navigationTitle", [ "$state", function(e) {
    var t = {
        title: ""
    };
    return {
        getObject: function() {
            return t;
        }
    };
} ]).factory("httpPostFactory", [ "$http", "BASE_URI", function(e, t) {
    return function(n, a, i) {
        e({
            url: t + n,
            method: "POST",
            data: a,
            headers: {
                "Content-Type": void 0
            }
        }).success(function(e) {
            i(e);
        });
    };
} ]).factory("isCordova", function() {
    var e = -1 === document.URL.indexOf("http://") && -1 === document.URL.indexOf("https://");
    return !!e;
}).controller("NavbarController", [ "$scope", "navigationTitle", function(e, t) {
    e.navObject = t.getObject();
} ]).controller("NavSidebarController", [ "$scope", "$uibModalInstance", function(e, t) {
    e.cancel = function() {
        t.dismiss("cancel");
    };
} ]).controller("StartpageController", [ "$scope", function(e) {
    e.openLink = function(e) {
        globalThis.open(e);
    };
} ]).directive("navsidebar", [ "$aside", "UserService", function(e, t) {
    return {
        restrict: "E",
        replace: !0,
        templateUrl: "partials/navigation.sidebar.button.tpl.html",
        controller: function(t, n) {
            t.showBackNav = function() {
                return n.includes("user.recipes") && n.$current.path.length > 2;
            }, t.onClick = function() {
                if (this.showBackNav()) {
                    to = n.$current;
                    do to = to.parent; while (to["abstract"]);
                    return n.transitionTo(to, {}, {
                        inherit: !0,
                        relative: n.$current
                    });
                }
                e.open({
                    templateUrl: "partials/navigation.sidebar.tpl.html",
                    controller: "NavSidebarController",
                    placement: "left",
                    size: "lg"
                });
            };
        }
    };
} ]).directive("access", [ "$rootScope", "UserService", function(e, t) {
    return {
        restrict: "A",
        link: function(n, a, i) {
            var r = function() {
                a.removeClass("hidden");
            }, o = function() {
                a.addClass("hidden");
            }, s = function(e) {
                var n;
                e && r(), n = t.authorize(void 0, c), 0 === n ? r() : o();
            }, c = i.access.split(",");
            c.length > 0 && s(!0), e.$on("$stateChangeSuccess", function() {
                c.length > 0 && s(!0);
            });
        }
    };
} ]).directive("ngReallyClick", [ "$uibModal", function(e) {
    return {
        restrict: "A",
        scope: {
            ngReallyClick: "&"
        },
        link: function(t, n, a) {
            n.bind("click", function() {
                if (t.$parent.schedule && t.$parent.schedule.recipe && t.$parent.schedule.recipe.name) var n = "Are you sure to delete the recipe " + t.$parent.schedule.recipe.name + " from schedule?"; else if (t.$parent.recipe && t.$parent.recipe.name) var n = "Are you sure to delete the recipe " + t.$parent.recipe.name + "?"; else var n = a.ngReallyMessage || "Are you sure?";
                var i = e.open({
                    animation: !0,
                    templateUrl: "partials/ngreally.tpl.html",
                    controller: [ "$scope", "$uibModalInstance", "message", function(e, t, n) {
                        e.message = n, e.ok = function() {
                            t.close();
                        }, e.cancel = function() {
                            t.dismiss("cancel");
                        };
                    } ],
                    size: "xs",
                    resolve: {
                        message: function() {
                            return n;
                        }
                    }
                });
                i.result.then(function() {
                    t.ngReallyClick();
                });
            });
        }
    };
} ]).directive("ngImageUpload", [ "httpPostFactory", function(e) {
    return {
        restrict: "A",
        scope: !0,
        link: function(t, n, a) {
            n.bind("change", function() {
                var a = new FormData();
                a.append("file", n[0].files[0]), e("api/upload", a, function(e) {
                    console.log(e), t.recipe.imagePath = e;
                });
            });
        }
    };
} ]).directive("cameraButton", [ "httpPostFactory", function(e) {
    return {
        restrict: "A",
        scope: !0,
        link: function(t, n, a) {
            n.bind("click", function() {
                navigator.camera.getPicture(function(n) {
                    globalThis.resolveLocalFileSystemURL(n, function(n) {
                        n.file(function(n) {
                            var a = new FileReader();
                            a.onloadend = function(a) {
                                var i = new Blob([ a.target.result ], {
                                    type: n.type
                                }), r = new FormData();
                                r.append("file", i, "file.jpg"), e("api/upload", r, function(e) {
                                    t.recipe.imagePath = e;
                                });
                            }, a.readAsArrayBuffer(n);
                        }, function(e) {});
                    }, function(e) {});
                }, function(e) {}, {
                    quality: 50,
                    destinationType: Camera.DestinationType.FILE_URI
                });
            });
        }
    };
} ]).directive("stateLoadingIndicator", [ "$rootScope", function(e) {
    return {
        restrict: "E",
        template: "<div ng-show='isStateLoading' class='loading-indicator overlay'><div class='loading-indicator-body'><div class='spinner'><double-bounce-spinner></double-bounce-spinner></div></div></div>",
        replace: !0,
        link: function(t, n, a) {
            t.isStateLoading = !1, e.$on("$stateChangeStart", function() {
                t.isStateLoading = !0;
            }), e.$on("$stateChangeSuccess", function() {
                t.isStateLoading = !1;
            });
        }
    };
} ]).filter("timeFilter", function() {
    var e = {
        ss: angular.identity,
        mm: function(e) {
            return 60 * e;
        },
        hh: function(e) {
            return 3600 * e;
        }
    };
    return function(t, n) {
        var a = e[n || "ss"](t), i = Math.floor(a / 3600), r = Math.floor(a % 3600 / 60);
        return i = i > 0 ? i : "", format = "" == i ? "mm min" : "hhh mmm", format.replace(/hh/, i).replace(/mm/, r);
    };
}).config([ "$stateProvider", "$urlRouterProvider", function(e, t) {
    t.otherwise("/"), e.state("anon", {
        "abstract": !0,
        views: {
            root: {
                template: "<ui-view />"
            }
        },
        data: {
            requiresLogin: !1,
            requiredPermissions: [ "NoUser" ]
        }
    }).state("anon.startpage", {
        url: "/",
        templateUrl: "partials/startpage.tpl.html",
        controller: "StartpageController",
        data: {
            title: "rezept-planer.de"
        }
    }).state("anon.user", {
        url: "/user",
        "abstract": !0,
        template: "<ui-view />"
    }).state("user", {
        "abstract": !0,
        views: {
            root: {
                template: '<div ui-view="main"></div>'
            }
        },
        data: {
            requiresLogin: !0,
            requiredPermissions: [ "User" ]
        }
    }).state("impressum", {
        url: "/impressum",
        views: {
            root: {
                templateUrl: "partials/impressum.tpl.html"
            }
        },
        data: {
            title: "Impressum"
        }
    }).state("accessdenied", {
        url: "/access/denied",
        views: {
            root: {
                templateUrl: "partials/access.denied.tpl.html"
            }
        }
    }).state("user.home", {
        url: "/home",
        views: {
            main: {
                templateUrl: "partials/home.tpl.html"
            }
        },
        data: {
            title: "Home"
        }
    });
} ]).run([ "$rootScope", "$state", "$stateParams", "$http", "UserService", "navigationTitle", "BASE_URI", function(e, t, n, a, i, r, o) {
    e.$state = t, e.$stateParams = n, e.print = function(e) {
        globalThis.print();
    }, e.$on("$stateChangeStart", function(n, s, c, l, u) {
        e.previousState = l ? l : {}, e.previousState.name = l.name ? l.name : "user.home", 
        e.previousStateParams = u ? u : {};
        var p = i.isAuthenticated();
        if (p === !0 && (a.get(o + "api/user/check"), "anon.startpage" == s.name && (n.preventDefault(), 
        t.go("user.home"))), s.data && s.data.title) {
            var d = r.getObject();
            d.title = s.data.title;
        }
    }), e.$on("$stateChangeSuccess", function() {});
} ]);