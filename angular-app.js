/**
 * CampusConnect - AngularJS 1.8 Application Module
 * Demonstrates: Directives (ng-app, ng-controller, ng-repeat, ng-model, ng-show, ng-hide, ng-click),
 * Two-way Data Binding, AngularJS Custom Filters, Form Validation ($valid, $dirty, $pristine).
 */

var app = angular.module('campusConnectApp', []);

// Custom Filter: Formatted Event Date
app.filter('ccDateFormat', function() {
    return function(dateString) {
        if (!dateString) return '';
        var d = new Date(dateString);
        var options = { day: 'numeric', month: 'short', year: 'numeric' };
        return d.toLocaleDateString('en-IN', options);
    };
});

// Custom Filter: Days Remaining Countdown
app.filter('daysRemaining', function() {
    return function(dateString) {
        if (!dateString) return '';
        var target = new Date(dateString);
        var today = new Date();
        var diffTime = target - today;
        var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays < 0) return 'Concluded';
        if (diffDays === 0) return 'Today!';
        return diffDays + ' days left';
    };
});

// Event Explorer Controller
app.controller('EventExplorerCtrl', ['$scope', '$http', function($scope, $http) {
    $scope.searchQuery = '';
    $scope.selectedCategory = 'all';
    $scope.selectedType = 'all';
    $scope.sortBy = 'date';
    $scope.sortReverse = false;
    $scope.isLoading = true;
    $scope.statusMessage = '';
    $scope.statusType = 'info';

    // Model for Quick Registration
    $scope.activeEvent = null;
    $scope.regData = {
        name: '',
        iuNumber: '',
        department: 'Computer Engineering',
        semester: '6th Semester',
        email: '',
        phone: ''
    };
    $scope.regSuccess = false;
    $scope.registrationTicket = null;

    // Load Events (Tries PHP API first, gracefully falls back to CampusData / LocalStorage)
    $scope.loadEvents = function() {
        $scope.isLoading = true;
        
        // Attempt PHP REST API
        $http.get('api/events.php?type=all')
            .then(function(response) {
                if (response.data && response.data.success && response.data.data.length > 0) {
                    $scope.events = response.data.data;
                    $scope.dataSource = 'MySQL Database via PHP API';
                    $scope.isDatabaseLive = true;
                } else {
                    $scope.loadLocalFallback();
                }
            }, function(error) {
                // If API fails (e.g. running on static file:// or port 8080 without PHP)
                $scope.loadLocalFallback();
            })
            .finally(function() {
                $scope.isLoading = false;
            });
    };

    $scope.loadLocalFallback = function() {
        if (typeof Storage !== 'undefined' && typeof Storage.get === 'function') {
            var cesa = Storage.get('cesaEvents', []);
            var sem = Storage.get('seminars', []).map(function(s) { s.event_type = 'seminar'; return s; });
            var gen = Storage.get('generalEvents', []).map(function(g) { g.event_type = 'general'; return g; });
            $scope.events = [].concat(cesa, sem, gen);
        } else if (typeof CampusData !== 'undefined') {
            $scope.events = [].concat(CampusData.cesaEvents, CampusData.seminars, CampusData.generalEvents);
        } else {
            $scope.events = [];
        }
        $scope.dataSource = 'Local Store (Offline/Demo Mode)';
        $scope.isDatabaseLive = false;
    };

    // Category Filter Function
    $scope.categoryFilter = function(event) {
        if ($scope.selectedCategory === 'all') return true;
        return event.category === $scope.selectedCategory;
    };

    // Event Type Filter Function (CESA, Seminar, General)
    $scope.typeFilter = function(event) {
        if ($scope.selectedType === 'all') return true;
        var t = event.event_type || event.type || 'cesa';
        return t === $scope.selectedType;
    };

    // Text Search Filter Function
    $scope.searchFilter = function(event) {
        if (!$scope.searchQuery) return true;
        var q = $scope.searchQuery.toLowerCase();
        var titleMatch = (event.title || '').toLowerCase().indexOf(q) !== -1;
        var descMatch = (event.description || '').toLowerCase().indexOf(q) !== -1;
        var orgMatch = (event.organizer || event.organizedBy || '').toLowerCase().indexOf(q) !== -1;
        var catMatch = (event.category || '').toLowerCase().indexOf(q) !== -1;
        return titleMatch || descMatch || orgMatch || catMatch;
    };

    // Filter Buttons Helper
    $scope.setCategory = function(cat) {
        $scope.selectedCategory = cat;
    };

    $scope.setType = function(type) {
        $scope.selectedType = type;
    };

    // Open Quick Registration Modal
    $scope.openRegister = function(event) {
        $scope.activeEvent = event;
        $scope.regSuccess = false;
        $scope.statusMessage = '';

        // Pre-fill from logged-in user if available
        if (typeof Auth !== 'undefined' && Auth.getCurrentUser) {
            var user = Auth.getCurrentUser();
            if (user && user.role === 'student') {
                $scope.regData.name = user.name || '';
                $scope.regData.iuNumber = user.iuNumber || '';
                $scope.regData.department = user.department || 'Computer Engineering';
                $scope.regData.semester = user.semester || '6th Semester';
                $scope.regData.email = user.email || '';
                $scope.regData.phone = user.phone || '';
            }
        }

        var modalEl = document.getElementById('angularRegisterModal');
        if (modalEl && typeof bootstrap !== 'undefined') {
            var modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
            modal.show();
        }
    };

    // Submit Registration via AngularJS
    $scope.submitRegister = function(isValid) {
        if (!isValid) {
            $scope.statusMessage = 'Please complete all required fields correctly.';
            $scope.statusType = 'danger';
            return;
        }

        var payload = {
            eventId: $scope.activeEvent.id,
            eventType: $scope.activeEvent.event_type || 'cesa',
            studentName: $scope.regData.name,
            name: $scope.regData.name,
            iuNumber: $scope.regData.iuNumber,
            department: $scope.regData.department,
            semester: $scope.regData.semester,
            email: $scope.regData.email,
            phone: $scope.regData.phone
        };

        // Try PHP backend
        $http.post('api/register_event.php', payload)
            .then(function(res) {
                if (res.data && res.data.success) {
                    $scope.regSuccess = true;
                    $scope.registrationTicket = res.data.registration;
                    // Update booked seats count in real time
                    $scope.activeEvent.seats_booked = ($scope.activeEvent.seats_booked || 0) + 1;
                    if (typeof Storage !== 'undefined') {
                        var regs = Storage.get('registrations', []);
                        regs.push(res.data.registration);
                        Storage.set('registrations', regs);
                    }
                } else {
                    $scope.statusMessage = (res.data && res.data.message) ? res.data.message : 'Registration failed.';
                    $scope.statusType = 'warning';
                }
            }, function(err) {
                // Fallback client storage
                if (typeof Registration !== 'undefined') {
                    var localRes = Registration.register($scope.activeEvent.id, $scope.activeEvent.event_type || 'cesa', payload);
                    if (localRes.success) {
                        $scope.regSuccess = true;
                        $scope.registrationTicket = localRes.registration;
                    } else {
                        $scope.statusMessage = localRes.message || 'Error processing registration.';
                        $scope.statusType = 'warning';
                    }
                }
            });
    };

    // Close Modal helper
    $scope.closeModal = function() {
        var modalEl = document.getElementById('angularRegisterModal');
        if (modalEl && typeof bootstrap !== 'undefined') {
            var modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();
        }
    };

    // Initialize
    $scope.loadEvents();
}]);
