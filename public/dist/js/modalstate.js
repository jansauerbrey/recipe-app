/* License: MIT - https://github.com/angular-ui/bootstrap/blob/master/LICENSE */
angular
	.module('modalstate', ['ui.router', 'ui.bootstrap'])

	/**
	 * Encapsulates the boilerplate typically needed to implement a state-driven modal.  Implemented as a provider so it
	 * can be injected like $stateProvider during the config phase and used to declare modal states.  Modal is based
	 * on ui.bootstrap.modal.
	 *
	 * Usage:
	 *
	 *   module.config(function(modalStateProvider) {
	 *     modalStateProvider.state('state.name', options);
	 *   });
	 *
	 * The options argument is a mix of options for modalStateProvider, $stateProvider and $modal.
	 *
	 * modalStateProvider:
	 * - returnState: the state to go to after the modal closes (default is '^' which returns to the immediate parent)
	 * - onModal: function called with the modal instance after it is created.  Use to access $modal's result/opened promises.
	 *
	 * $stateProvider receives the 'onEnter', 'onExit', 'url', 'params', 'abstract', 'reloadOnSearch' and 'data' options
	 * if provided.  $modal receives all remaining options.  No view or controller parameters are passed to $stateProvider;
	 * these are handled by $modal.  Resolve is also handled by $modal.
	 *
	 * modalStateProvider attempts to harmonize the state change event model with a modal's local event model.  Both
	 * models support veto of a requested transition, but the state model is global and consequently must be observed
	 * asynchronously while the modal model is scoped to the modal controller and normally synchronous.  Using a modal
	 * state definition, it's possible to add synchronous decision logic as a global `$stateChangeStart` listener, a
	 * local `modal.closing` listener or both.  All must pass before the modal can close, and none will be called more
	 * than once per close attempt (making synchronous confirm interactions safe).  There are some minor caveats (see
	 * comments below about `$close` and `$dismiss` on the scope and `dismissAll` on `$modalStack`), but the overall
	 * behavior is reliable.
	 *
	 * Note that due to transclusion, $modal's view scope will not be the same as its controller scope; it will be a
	 * child.  This is a basic characteristic of $modal.  Use nested (dot) references in the view to avoid unexpected
	 * issues with prototypal inheritance.  Also note that $modal's scopes inherit from $rootScope by default.  You can
	 * pass a different scope in the state definition, but during the configuration phase, this is often impractical.
	 * The `modalScope` directive help with this by stashing the current scope for the next modal state transition to
	 * find and use.  Add `modal-scope` to the same element as `ui-sref` for a modal state and the resulting modal will
	 * inherit the current scope as though it had been embedded at that point in the document.
	 */
	.provider('modalState', ['$stateProvider', function($stateProvider) {

		var _stack = [];
		var _parentScope = null;

		var _dismissAllIntent = false;
		var _dismissAllLast = null;
		var _dismissAllReason = null;
		var _dismissAllResult = null;

		_dismissAll.$inject = ['$uibModalStack', '$timeout'];
		function _dismissAll($uibModalStack, $timeout) {
			if (_dismissAllIntent) {
				var last = _dismissAllLast;
				_dismissAllLast = $uibModalStack.getTop();
				if (_dismissAllLast === undefined || _dismissAllLast === last) { // end when the stack is empty or no change occurred
					_dismissAllResult[_dismissAllLast === undefined ? 'resolve' : 'reject'](_dismissAllReason);
					_dismissAllResult = null;
					_dismissAllReason = null;
					_dismissAllLast = null;
					_dismissAllIntent = false;
				} else {
					$uibModalStack.dismissAll(_dismissAllReason);
					$timeout(function() {
						_dismissAll($uibModalStack, $timeout);
					});
				}
			}
		}
		this.$get = $get;
		$get.$inject = ['$q', '$timeout', '$uibModalStack'];
		function $get($q, $timeout, $uibModalStack) {
			return {
				/**
				 * Allows modal states to be defined dynamically in the run phase.
				 */
				state: this.state,

				/**
				 * @returns {number} How many state-based modals are currently open.
				 */
				getDepth: function() {
					return _stack.length;
				},

				/**
				 * @returns {*|boolean} True if a state-driven modal is at the top of $modalStack.
				 */
				isTop: function() {
					var top = $uibModalStack.getTop();
					return top && _stack.length && top.value.modalScope === _stack[_stack.length-1].scope;
				},

				/**
				 * Sets a scope to be used as the parent of the next modal instance to be created.
				 * Add a modal-scope directive to a ui-sref to spawn the modal with inherited access to the current scope.
				 */
				setParentScope: function(parentScope) {
					_parentScope = parentScope;
				},

				/**
				 * Use instead of $modalStack.dismissAll(reason).  The coordination between modal lifecycle and state lifecycle
				 * requires that the close process happen asynchronously.  As a consequence, $modalStack's dismissAll method
				 * only succeeds in closing the first modal.  Use this method to propagate the dismiss intent until all modals
				 * are closed or a modal vetos the close.
				 *
				 * Note that in scenarios involving a mixed stack of manual and state-driven modals, this method may not
				 * yield a result.
				 *
				 * @param reason
				 * @return {Promise} a promise yielding a boolean indicating whether all modals were dismissed
				 */
				dismissAll: function(reason) {
					if (!_dismissAllIntent) {
						_dismissAllIntent = true;
						_dismissAllReason = reason;
						_dismissAllResult = $q.defer();
					}
					_dismissAll($uibModalStack, $timeout);
					return _dismissAllResult ? _dismissAllResult.promise : $q.when(undefined);
				}
			};
		};

		/**
		 * Defines a new state whose lifecycle is coordinated with the display and dismissal of a bootstrap modal.
		 * @param stateName
		 * @param options
		 * @returns {*} this for chaining
		 */
		this.state = function(stateName, options) {
			// Internal properties of the modal state instance.
			var instanceDef = {
				childPattern: new RegExp('^' + stateName.replace(/\./g, '\\.') + '\\.'),
				returnState: options.returnState || '^',
				onModal: options.onModal || null,
				onEnter: options.onEnter || null,
				onExit: options.onExit || null
			};

			// $stateProvider options (view/controller properties are handled by $modal)
      var keys_state = ['url', 'params', 'abstract', 'reloadOnSearch', 'data'];
      var stateDef = {};
      keys_state.forEach(function (d) {
          stateDef[d] = options[d];
      })
      
      stateDef.onEnter = onEnter;
			onEnter.$inject = ['$rootScope', '$uibModal', '$injector', '$state', '$timeout'];
			function onEnter($rootScope, $uibModal, $injector, $state, $timeout) {
				_stack.push(instanceDef);
        
        var getType = {};
				if (typeof instanceDef.onEnter == 'function' && getType.toString.call(instanceDef.onEnter) == '[object Function]') {
					$injector.invoke(instanceDef.onEnter);
				}

				instanceDef.broadcast = true; // used to prevent double-broadcast if close is modal-initiated
				instanceDef.result = null;
				instanceDef.closed = false;

				instanceDef.startListener = $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
					if (fromState.name === stateName && !instanceDef.childPattern.test(toState.name)) {
						if (instanceDef.broadcast) {
							instanceDef.result = undefined;
							instanceDef.closed = false; // treat state-driven transition as a dismissal
							if (instanceDef.scope && instanceDef.scope.$broadcast('modal.closing', instanceDef.result, instanceDef.closed).defaultPrevented) {
								event.preventDefault();
							} else {
							}
						} else {
							instanceDef.broadcast = true;
						}
					}
				});

				// $modal options
				var keys_modal = Object.keys(options);
				var keys_omit = Object.keys(stateDef);
				var keys_omit_always = ['returnState', 'onModal', 'onEnter', 'onExit', 'scope'];
				keys_omit.forEach(function (d) {
          delete keys_modal[d];
        })
				keys_omit_always.forEach(function (d) {
          delete keys_modal[d];
        })
				
        var modalDef = {};
        keys_modal.forEach(function (d) {
            modalDef[d] = options[d];
        })
				
				modalDef.scope = options.scope || _parentScope || $rootScope;
				_parentScope = null; // one-time use

				instanceDef.modal = $uibModal.open(modalDef);
				instanceDef.modal.opened.then(function() {
					/*
					 * $modal doesn't provide specific access to the scope it creates for the modal controller, but we
					 * can find it by walking the children of the known starting scope looking for the signature of an
					 * object we know to be present.  We need this scope in order to control close event handling.
					 */
					var childScope;
					for(childScope = modalDef.scope.$$childHead; childScope; childScope = childScope.$$nextSibling) {
						if (childScope.$close === instanceDef.modal.close) {
							break;
						}
					}
					if (!childScope) {
						throw new Error('modalState: failed to identify controller scope under modal scope ' + modalDef.scope.$id);
					}

					instanceDef.scope = childScope;

					/*
					 * Closing can be state-initiated or modal-initiated.  We want each case to have equal veto opportunity.
					 * If the event is modal-initiated, then we need to initially veto and fire a state transition that
					 * will make the final decision.  Our only hook is the scope event which requires some trickery to
					 * intercept.  A consequence of this overall approach is that a modal controller's calls to the
					 * synchronous $close and $dismiss scope methods that are added by $modal will return false even if
					 * the event may eventually be approved by the state transition.
					 */
					childScope.$on('modal.closing', function(event, result, closed) {
						if ($state.current.name === stateName) { // the broadcast may reach multiple modals
							var defaultPrevented = event.defaultPrevented; // the controller registers first and my already have vetoed
							event.preventDefault(); // even if other listenrs don't veto, we need to stop the event so we can turn it into a state transition
							event.preventDefault = function() {
								defaultPrevented = true; // did any other listeners veto?
							};
							$timeout(function() { // wait for other listeners to process the event
								if (!defaultPrevented) {
									instanceDef.broadcast = false; // event is already cleared as far as the modal is concerned
									instanceDef.result = result;
									instanceDef.closed = closed;
									$state.go(instanceDef.returnState); // drive the close as a state transition instead
								}
							});
						} else {
						}
					});
				});
        
        getType = {};
				if (typeof instanceDef.onModal == 'function' && getType.toString.call(instanceDef.onModal) == '[object Function]') {
					instanceDef.onModal(instanceDef.modal);
				}
			};

			stateDef.onExit = onExit;
			onExit.$inject = ['$injector'];
			function onExit($injector) {
				instanceDef.startListener();
				var $broadcast = instanceDef.scope.$broadcast;
				instanceDef.scope.$broadcast = function(name, args) {
					if (name === 'modal.closing') {
						return {defaultPrevented:false}; // ignore this event; treat it as allowed
					} else {
						return $broadcast.apply(this, arguments);
					}
				};
				instanceDef.modal[instanceDef.closed ? 'close' : 'dismiss'](instanceDef.result);
				instanceDef.scope.$broadcast = $broadcast;
				delete instanceDef.startListener;
				delete instanceDef.scope;
				delete instanceDef.modal;
				delete instanceDef.result;
        
        getType = {};
				if (typeof instanceDef.onExit == 'function' && getType.toString.call(instanceDef.onExit) == '[object Function]') {
					$injector.invoke(instanceDef.onExit);
				}

				_stack.pop();
			};

			$stateProvider.state(stateName, stateDef);

			return this; // chaining
		};
	}])
	
	/**
	 * Use with ui-sref to pass the current scope to a modal opened by the state transition.
	 * Modals normally inherit from the root scope, but this means they lose access to any lexically enclosing scope
	 * properties they might have expected.
   */
	.directive('modalScope', ['modalState', function(modalState) {
    return {
		  restrict: 'A',
		  link: function(scope, elem, attrs) {
			  // Don't have to worry about precedence here because ui-sref uses $timeout.
			  elem.bind("click", function() {
				  modalState.setParentScope(scope);
			  });
		  }
	  };
	}])

;//end module