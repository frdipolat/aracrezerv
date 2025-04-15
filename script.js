document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const authContainer = document.getElementById('auth-container');
    const loginSection = document.getElementById('login-section'); // Added back
    const registerSection = document.getElementById('register-section'); // Added back
    const loginForm = document.getElementById('login-form'); // Added back
    const registerForm = document.getElementById('register-form'); // Added back
    const showRegisterLink = document.getElementById('show-register'); // Added back
    const showLoginLink = document.getElementById('show-login'); // Added back
    const loginError = document.getElementById('login-error'); // Added back
    const registerError = document.getElementById('register-error'); // Added back
    // Removed microsoftLoginButton, authError

    const appContent = document.getElementById('app-content');
    const newReservationForm = document.getElementById('new-reservation');
    const reservationError = document.getElementById('reservation-error');
    const formTitle = document.getElementById('form-title');
    const formSubmitButton = document.getElementById('form-submit-button');

    const userInfo = document.getElementById('user-info');
    const userEmailElement = document.getElementById('user-email');
    const logoutButton = document.getElementById('logout-button');
    const darkModeToggleButton = document.getElementById('darkModeToggle'); // Added Dark Mode Toggle Button

    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const endTimeInput = document.getElementById('end-time'); // Added End Time Input
    const startTimeInput = document.getElementById('start-time'); // Added Start Time Input
    const conflictWarningElement = document.getElementById('conflict-warning'); // Added Conflict Warning Element
    const cancelEditButton = document.getElementById('cancel-edit-button');
    const departmentFilterSelect = document.getElementById('department-filter');
    // Added Date Filter Elements
    const startDateFilterInput = document.getElementById('start-date-filter');
    const endDateFilterInput = document.getElementById('end-date-filter');
    const clearFiltersButton = document.getElementById('clear-filters-button');

    const loadingOverlay = document.getElementById('loading-overlay'); // Added loading overlay element

    // --- Modal Elements --- (Added)
    const modalOverlay = document.getElementById('event-action-modal');
    const modalContent = modalOverlay.querySelector('.modal-content'); // For potential future use (e.g., click outside)
    const modalEventDetails = document.getElementById('modal-event-details');
    const modalEditButton = document.getElementById('modal-edit-button');
    const modalDeleteButton = document.getElementById('modal-delete-button');
    const modalCloseButton = document.getElementById('modal-close-button');

    // --- Edit Modal Elements --- (Updated)
    const editModal = document.getElementById('edit-modal');
    const editReservationIdInput = document.getElementById('edit-reservation-id');
    const editDepartmentInput = document.getElementById('edit-department');
    const editDescriptionInput = document.getElementById('edit-description');
    const editStartDateTimeInput = document.getElementById('edit-start-datetime');
    const editEndDateTimeInput = document.getElementById('edit-end-datetime');
    const editError = document.getElementById('edit-error');

    // --- API Configuration ---
    const API_BASE_URL = 'http://localhost:3566/api';
    // OpenWeatherMap API Configuration (Added)
    const weatherApiKey = 'b2bd5a63cd140194170f8b16de9fc4c8'; // YOUR API KEY HERE
    const weatherCity = 'Izmir'; // <<< CHANGE CITY TO IZMIR
    const weatherLang = 'tr'; // Language for description
    const weatherUnits = 'metric'; // Units for temperature (Celsius)

    // --- State Management ---
    let editingReservationId = null;
    let calendar = null;
    // Removed currentUser global variable

    // --- Token Management --- (Added back)
    const saveToken = (token) => localStorage.setItem('authToken', token);
    const getToken = () => localStorage.getItem('authToken');
    const removeToken = () => localStorage.removeItem('authToken');

    // Decode JWT (simple decode, no verification needed here, backend verifies)
    const getUserFromToken = (token) => {
        if (!token) return null;
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload); // Contains { id, email }
        } catch (e) {
            console.error("Failed to decode token:", e);
            removeToken(); // Remove invalid token
            return null;
        }
    };

    // --- Weather Widget Elements (Added)
    const weatherTempElement = document.getElementById('weather-temp');
    const weatherIconElement = document.getElementById('weather-icon');
    const weatherDescElement = document.getElementById('weather-desc');
    const weatherCityElement = document.getElementById('weather-city');

    // --- Currency Rate Elements (Added)
    const rateUsdElement = document.getElementById('rate-usd');
    const rateEurElement = document.getElementById('rate-eur');
    const rateGbpElement = document.getElementById('rate-gbp');
    // Get references to the icon elements (Added)
    const iconUsdElement = rateUsdElement.nextElementSibling; 
    const iconEurElement = rateEurElement.nextElementSibling;
    const iconGbpElement = rateGbpElement.nextElementSibling;

    // --- Theme Management --- (Added)
    const applyTheme = (theme) => {
        const iconElement = darkModeToggleButton.querySelector('i'); // Find the icon within the button
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
            iconElement.classList.remove('fa-moon'); // Remove moon icon
            iconElement.classList.add('fa-sun');    // Add sun icon
        } else {
            document.body.classList.remove('dark-mode');
            iconElement.classList.remove('fa-sun');  // Remove sun icon
            iconElement.classList.add('fa-moon');   // Add moon icon
        }
        localStorage.setItem('theme', theme); // Save preference
    };

    const toggleTheme = () => {
        const currentTheme = localStorage.getItem('theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        applyTheme(newTheme);
    };

    // --- UI Update Functions ---
    const showLoginScreen = () => {
        authContainer.style.display = 'block';
        loginSection.style.display = 'block'; // Show login form
        registerSection.style.display = 'none'; // Hide register form
        appContent.style.display = 'none';
        userInfo.style.display = 'none';
        loginError.textContent = ''; // Clear errors
        registerError.textContent = '';
        loginError.className = 'error-message'; // Reset classes
        registerError.className = 'error-message'; // Reset classes
    };

     const showRegisterScreen = () => { // Added back
         authContainer.style.display = 'block';
         loginSection.style.display = 'none';
         registerSection.style.display = 'block';
         appContent.style.display = 'none';
         userInfo.style.display = 'none';
         loginError.textContent = '';
         registerError.textContent = '';
         loginError.className = 'error-message'; // Reset classes
         registerError.className = 'error-message'; // Reset classes
     };

    const showAppScreen = (user) => {
        authContainer.style.display = 'none';
        appContent.style.display = 'grid'; // Use grid for app layout
        userInfo.style.display = 'flex';
        userEmailElement.textContent = `Hoşgeldin, ${user.firstName || user.email}`; // Show first name or email
        reservationError.textContent = '';
        initializeCalendar();
        fetchWeatherData(); 
        // Fetch currency rates when app screen is shown (Added)
        fetchCurrencyRates();
    };

    // --- API Call Helper --- (Reverted to use JWT)
    const apiFetch = async (endpoint, options = {}) => {
        const token = getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`; // Add JWT token
        }

        try {
            // Removed credentials: 'include'
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers: headers,
            });

            // Handle unauthorized/forbidden by logging out (JWT specific)
             if (response.status === 401 || response.status === 403) {
                 console.warn(`Auth error (${response.status}) fetching ${endpoint}. Logging out.`);
                 handleLogout(); // Call logout which removes token and shows login
                 throw new Error(`Authentication required (${response.status})`);
             }

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                const errorMessage = data.error || `API Hatası: ${response.status}`;
                console.error(`API Error on ${endpoint}:`, errorMessage, data);
                 throw new Error(errorMessage);
            }
            return data;
        } catch (error) {
            console.error(`Fetch error for ${endpoint}:`, error);
             throw error;
        }
    };


    // --- Event Listeners --- (Reverted)
     showRegisterLink.addEventListener('click', (e) => {
         e.preventDefault();
         showRegisterScreen();
     });

     showLoginLink.addEventListener('click', (e) => {
         e.preventDefault();
         showLoginScreen();
     });

    // --- Loading Indicator Functions --- (Added)
    const showLoading = () => {
        if (loadingOverlay) loadingOverlay.style.display = 'flex';
    };
    const hideLoading = () => {
        if (loadingOverlay) loadingOverlay.style.display = 'none';
    };

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginError.textContent = '';
        showLoading(); // Show loading
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const data = await apiFetch('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });
            saveToken(data.accessToken);
            initializeApp(); // Re-initialize app state based on new token
        } catch (error) {
            console.error('Login failed:', error);
            loginError.textContent = error.message || 'Giriş başarısız. Lütfen tekrar deneyin.';
        } finally {
            hideLoading(); // Hide loading
        }
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        registerError.textContent = '';
        registerError.className = 'error-message';
        showLoading();
        // Read new fields
        const firstName = document.getElementById('register-firstName').value;
        const lastName = document.getElementById('register-lastName').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;

        if (password !== confirmPassword) {
            registerError.textContent = 'Şifreler eşleşmiyor.';
             registerError.classList.add('show');
            hideLoading();
            return;
        }
        // Basic validation for names
        if (!firstName || !lastName) {
             registerError.textContent = 'Ad ve soyad alanları zorunludur.';
             registerError.classList.add('show');
             hideLoading();
             return;
         }

        try {
            // Send new fields to backend
            const data = await apiFetch('/auth/register', {
                method: 'POST',
                body: JSON.stringify({ email, password, firstName, lastName }), // Include names
            });
            registerError.textContent = 'Kayıt başarılı! Lütfen giriş yapın.';
            registerError.className = 'success-message show'; // Add show class
             setTimeout(() => {
                 showLoginScreen();
                 document.getElementById('login-email').value = email; // Pre-fill email on login
             }, 1500);

        } catch (error) {
            console.error('Registration failed:', error);
            registerError.textContent = error.message || 'Kayıt başarısız. Lütfen tekrar deneyin.';
            registerError.className = 'error-message show'; // Add show class
        } finally {
            hideLoading();
        }
    });

    logoutButton.addEventListener('click', () => {
        handleLogout();
    });

     const handleLogout = () => { // Added back specific logout handler
         removeToken();
         showLoginScreen();
     };

    cancelEditButton.addEventListener('click', () => {
        resetFormToCreateMode();
    });

    departmentFilterSelect.addEventListener('change', () => {
        if (calendar) {
            showLoading(); // Show loading before refetch
            calendar.refetchEvents();
            // Hide is handled within the events source function
        }
    });

    // Add listeners for date filters
    startDateFilterInput.addEventListener('change', () => {
        // Optional: Add validation (e.g., end date >= start date)
        if (calendar) calendar.refetchEvents();
    });
    endDateFilterInput.addEventListener('change', () => {
        // Optional: Add validation (e.g., end date >= start date)
        if (calendar) calendar.refetchEvents();
    });

    // Add listener for clear filters button
    clearFiltersButton.addEventListener('click', () => {
        departmentFilterSelect.value = '';
        startDateFilterInput.value = '';
        endDateFilterInput.value = '';
        if (calendar) calendar.refetchEvents();
    });

    // --- Conflict Check Function --- (Added)
    async function checkConflict() {
        // Get current values
        const startDate = startDateInput.value;
        const startTime = startTimeInput.value;
        const endDate = endDateInput.value;
        const endTime = endTimeInput.value;

        // Hide warning initially
        conflictWarningElement.style.display = 'none';
        conflictWarningElement.textContent = '';

        // Only check if all fields are filled and form a valid range
        if (startDate && startTime && endDate && endTime) {
            const startDateTimeString = `${startDate}T${startTime}:00`;
            const endDateTimeString = `${endDate}T${endTime}:00`;
            const startDateTime = new Date(startDateTimeString);
            const endDateTime = new Date(endDateTimeString);

            if (!isNaN(startDateTime.getTime()) && !isNaN(endDateTime.getTime()) && endDateTime > startDateTime) {
                 console.log(`Checking conflict for ${startDateTimeString} - ${endDateTimeString}`);
                 try {
                     let checkEndpoint = `/reservations/check?start=${encodeURIComponent(startDateTimeString)}&end=${encodeURIComponent(endDateTimeString)}`;
                     // If editing, add excludeId
                     if (editingReservationId) {
                         checkEndpoint += `&excludeId=${editingReservationId}`;
                     }

                     showLoading(); // Show loading during check
                     const result = await apiFetch(checkEndpoint);
                     hideLoading(); // Hide loading after check

                     if (result.conflict) {
                         conflictWarningElement.textContent = 'Uyarı: Seçilen zaman aralığında başka bir rezervasyon var!';
                         conflictWarningElement.style.display = 'block';
                     } else {
                          conflictWarningElement.textContent = '';
                          conflictWarningElement.style.display = 'none';
                     }
                 } catch (error) {
                     hideLoading(); // Hide loading on error too
                     console.error("Error checking for conflicts:", error);
                     // Optionally show a generic error, but maybe not necessary for conflict check
                     // conflictWarningElement.textContent = 'Çakışma kontrolü sırasında hata.';
                     // conflictWarningElement.style.display = 'block';
                 }
            }
        }
    }

    // --- Add change listeners to date/time inputs to trigger conflict check
    startDateInput.addEventListener('change', checkConflict);
    startTimeInput.addEventListener('change', checkConflict);
    endDateInput.addEventListener('change', checkConflict);
    endTimeInput.addEventListener('change', checkConflict);

    // --- Modal Functions --- (Added)
    function openEventModal(event) {
        // Store event info on buttons using dataset
        modalDeleteButton.dataset.eventId = event.id;
        modalEditButton.dataset.eventId = event.id;
        // Store necessary info for handleEditStart on the edit button
        modalEditButton.dataset.department = event.extendedProps.department;
        modalEditButton.dataset.startStr = event.startStr;
        modalEditButton.dataset.endStr = event.endStr;
        modalEditButton.dataset.description = event.extendedProps.description || '';
        modalEditButton.dataset.userId = event.extendedProps.userId;

        // Optional: Display some event details in the modal
        modalEventDetails.innerHTML = `
            <strong>Departman:</strong> ${event.extendedProps.department}<br>
            <strong>Başlangıç:</strong> ${formatDateTime(event.startStr)}<br>
            <strong>Bitiş:</strong> ${formatDateTime(event.endStr)}
            ${event.extendedProps.description ? `<br><strong>Açıklama:</strong> ${event.extendedProps.description}` : ''}
        `;

        modalOverlay.style.display = 'flex'; // Show the modal
    }

    function closeEventModal() {
        modalOverlay.style.display = 'none'; // Hide the modal
        // Clear data from buttons
        delete modalDeleteButton.dataset.eventId;
        delete modalEditButton.dataset.eventId;
        delete modalEditButton.dataset.department;
        delete modalEditButton.dataset.startStr;
        delete modalEditButton.dataset.endStr;
        delete modalEditButton.dataset.description;
        delete modalEditButton.dataset.userId;
    }

    // --- Modal Button Listeners --- (Added)
    modalCloseButton.addEventListener('click', closeEventModal);

    modalDeleteButton.addEventListener('click', () => {
        const eventId = modalDeleteButton.dataset.eventId;
        if (eventId) {
            // Confirm again before deleting via modal
            if (confirm("Bu rezervasyonu silmek istediğinizden emin misiniz?")) {
                 handleDelete(eventId);
            }
        }
        closeEventModal(); // Close modal regardless of confirmation
    });

    modalEditButton.addEventListener('click', () => {
        const eventId = modalEditButton.dataset.eventId;
        if (eventId) {
            // Reconstruct the reservation object from dataset
            const reservation = {
                id: eventId,
                department: modalEditButton.dataset.department,
                startDateTime: modalEditButton.dataset.startStr,
                endDateTime: modalEditButton.dataset.endStr,
                description: modalEditButton.dataset.description,
                userId: parseInt(modalEditButton.dataset.userId, 10) // Ensure userId is a number if needed
            };
            handleEditStart(reservation);
        }
        closeEventModal();
    });

    // --- Edit Modal Functions (Updated) ---
    function openEditModal(event) {
        if (!editModal || !editForm) {
            console.error("Edit modal elements not found!");
            return;
        }
        editError.textContent = ''; // Clear previous errors
        const props = event.extendedProps;

        console.log("Opening edit modal for event:", event);

        // Populate the modal form
        editReservationIdInput.value = event.id;
        editDepartmentInput.value = props.department || '';
        editDescriptionInput.value = props.description || '';
        editStartDateTimeInput.value = event.start ? formatDateTimeLocal(event.start.toISOString()) : '';
        editEndDateTimeInput.value = event.end ? formatDateTimeLocal(event.end.toISOString()) : '';

        // Show the modal by adding the 'show' class
        editModal.classList.add('show');
    }

    function closeEditModal() {
         if (!editModal) return;
         // Hide the modal by removing the 'show' class
         editModal.classList.remove('show');
         editError.textContent = ''; // Clear errors when closing
         // editForm.reset(); // Optional: Reset form fields
    }

    // --- FullCalendar Initialization --- (Update event coloring/click logic)
    function initializeCalendar() {
        const calendarEl = document.getElementById('calendar');
        if (!calendarEl) {
            console.error("Calendar element not found!");
            return;
        }
        // Remove the early return check for debugging
        // if (calendar) { calendar.refetchEvents(); return; } 

        const currentUser = getUserFromToken(getToken()); // Get user info for coloring/click

        calendar = new FullCalendar.Calendar(calendarEl, {
            locale: 'tr',
            initialView: 'timeGridWeek',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            buttonText: {
                today:    'Bugün',
                month:    'Ay',
                week:     'Hafta',
                day:      'Gün',
                list:     'Liste'
            },
            slotMinTime: '00:00:00',
            slotMaxTime: '24:00:00',
            editable: true,
            selectable: true,
            selectMirror: true,
            nowIndicator: true,
            eventDrop: handleEventUpdate,
            eventResize: handleEventUpdate,
            events: async (fetchInfo, successCallback, failureCallback) => {
                showLoading();
                const selectedDepartment = departmentFilterSelect.value;
                const filterStartDate = startDateFilterInput.value;
                const filterEndDate = endDateFilterInput.value;

                const params = new URLSearchParams();

                if (selectedDepartment) {
                    params.append('department', selectedDepartment);
                }
                if (filterStartDate) {
                    params.append('start', filterStartDate);
                }
                if (filterEndDate) {
                    params.append('end', filterEndDate);
                }

                let endpoint = '/reservations';
                const queryString = params.toString();
                if (queryString) {
                    endpoint += `?${queryString}`;
                }

                console.log("Fetching events from:", endpoint);

                try {
                    const reservations = await apiFetch(endpoint);
                    const events = reservations.map(res => {
                        const bgColor = getRandomColor();
                        const textColor = getTextColorForBg(bgColor);
                        const parts = bgColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
                        let borderColor = bgColor;
                        if (parts) {
                            const hue = parts[1]; const saturation = parts[2]; const lightness = parseInt(parts[3], 10);
                            borderColor = `hsl(${hue}, ${saturation}%, ${Math.max(0, lightness - 15)}%)`;
                        }
                        return {
                            id: res.id, title: `${res.userName} (${res.department})`,
                            start: res.startDateTime, end: res.endDateTime,
                            extendedProps: { description: res.description, userId: res.userId, department: res.department, userName: res.userName },
                            color: bgColor, borderColor: borderColor, textColor: textColor
                        };
                    });
                    successCallback(events);
                } catch (error) {
                    console.error('Error fetching events for calendar:', error);
                    failureCallback(error);
                    if (!error.message.includes('Authentication required')) {
                        reservationError.textContent = `Takvim verileri yüklenemedi: ${error.message}`;
                    }
                } finally {
                    hideLoading();
                }
            },
            eventClick: (info) => {
                 const clickedUserId = info.event.extendedProps.userId;
                 const loggedInUser = getUserFromToken(getToken());

                 if (loggedInUser && loggedInUser.id === clickedUserId) {
                     openEventModal(info.event);
                 } else {
                     alert(`Rezervasyon:\nKullanıcı: ${info.event.extendedProps.userName || info.event.extendedProps.ownerName || 'Bilinmiyor'}\nDepartman: ${info.event.extendedProps.department}\nBaşlangıç: ${formatDateTime(info.event.startStr)}\nBitiş: ${formatDateTime(info.event.endStr)}\nAçıklama: ${info.event.extendedProps.description || '-'}`);
                 }
             },
            select: function(info) {
                 console.log('Selected:', info.startStr, 'to', info.endStr);

                 if (info.allDay) {
                      console.log('All-day selection ignored.');
                      return;
                 }

                 resetFormToCreateMode();

                 const startDate = info.startStr.substring(0, 10);
                 const startTime = info.startStr.substring(11, 16);
                 let endDate = info.endStr.substring(0, 10);
                 let endTime = info.endStr.substring(11, 16);

                 if (info.startStr === info.endStr) {
                     const startDt = new Date(info.startStr);
                     const endDt = new Date(startDt.getTime() + 60 * 60 * 1000);
                     endDate = endDt.toISOString().substring(0, 10);
                     endTime = endDt.toISOString().substring(11, 16);
                 }
                 if (!startTime || !endTime || startTime.length !== 5 || endTime.length !== 5) {
                     console.warn("Could not parse valid time from selection.");
                     return;
                 }

                 startDateInput.value = startDate;
                 document.getElementById('start-time').value = startTime;
                 endDateInput.value = endDate;
                 document.getElementById('end-time').value = endTime;

                 const event = new Event('change');
                 startDateInput.dispatchEvent(event);

                 newReservationForm.scrollIntoView({ behavior: 'smooth' });

                 conflictWarningElement.style.display = 'none';
                 conflictWarningElement.textContent = '';
             },
            eventContent: function(arg) {
                const event = arg.event;
                const props = event.extendedProps;

                const eventEl = document.createElement('div');
                eventEl.classList.add('fc-event-main-custom');

                // --- REMOVED Car Icon ---
                // const iconEl = document.createElement('i');
                // iconEl.className = 'fas fa-car event-icon';
                // eventEl.appendChild(iconEl);

                // Add Event Details (remains the same)
                let infoHtml = `<span class="event-title"><b>${event.title || props.department || 'Rezervasyon'}</b></span><br>`;
                if (props.userName) {
                    infoHtml += `<span class="event-detail">Kullanıcı: ${props.userName}</span><br>`;
                }
                if (props.description && props.description.trim() !== '') {
                    infoHtml += `<span class="event-detail event-description">Açıklama: ${props.description}</span>`;
                }
                const infoFragment = document.createRange().createContextualFragment(infoHtml);
                eventEl.appendChild(infoFragment);

                return { domNodes: [eventEl] };
            }
        });

        calendar.render();
    }

    // --- Function to Handle Drag/Drop and Resize --- (Added)
    async function handleEventUpdate(changeInfo) {
        const event = changeInfo.event;
        const currentUser = getUserFromToken(getToken());

        if (!currentUser || currentUser.id !== event.extendedProps.userId) {
            console.warn("User tried to modify an event they don't own.");
            alert("Sadece kendi rezervasyonlarınızı değiştirebilirsiniz.");
            changeInfo.revert();
            return;
        }

        const reservationId = event.id;
        const newStartStr = event.start.toISOString();
        const newEndStr = event.end.toISOString();

        console.log(`Attempting update for event ${reservationId}: ${newStartStr} - ${newEndStr}`);
        showLoading();
        reservationError.textContent = '';

        try {
            const checkEndpoint = `/reservations/check?start=${encodeURIComponent(newStartStr)}&end=${encodeURIComponent(newEndStr)}&excludeId=${reservationId}`;
            const conflictResult = await apiFetch(checkEndpoint);

            if (conflictResult.conflict) {
                console.warn("Conflict detected during drag/resize.");
                alert("Uyarı: Seçilen yeni zaman aralığında başka bir rezervasyon var! Değişiklik geri alındı.");
                changeInfo.revert();
                hideLoading();
                return;
            }

            const updateData = {
                department: event.extendedProps.department,
                description: event.extendedProps.description,
                startDateTime: newStartStr,
                endDateTime: newEndStr,
            };

            await apiFetch(`/reservations/${reservationId}`, {
                method: 'PUT',
                body: JSON.stringify(updateData),
            });

            console.log(`Event ${reservationId} updated successfully.`);
        } catch (error) {
            console.error('Error updating reservation via drag/drop/resize:', error);
            reservationError.textContent = `Rezervasyon güncellenemedi: ${error.message}`;
            changeInfo.revert();
        } finally {
            hideLoading();
        }
    }

    // --- Edit Handling ---
    function handleEditStart(reservation) {
        const currentUser = getUserFromToken(getToken());
        if (!currentUser || currentUser.id !== reservation.userId) {
             console.warn("Attempted to edit reservation not owned by current user.");
             return;
        }
        console.log("Editing reservation:", reservation);
        editingReservationId = reservation.id;

        document.getElementById('department').value = reservation.department;
        const startDate = reservation.startDateTime.substring(0, 10);
        const startTime = reservation.startDateTime.substring(11, 16);
        const endDate = reservation.endDateTime.substring(0, 10);
        const endTime = reservation.endDateTime.substring(11, 16);

        startDateInput.value = startDate;
        document.getElementById('start-time').value = startTime;
        endDateInput.value = endDate;
        document.getElementById('end-time').value = endTime;
        document.getElementById('aciklama').value = reservation.description || '';

        formTitle.textContent = 'Rezervasyonu Düzenle';
        formSubmitButton.textContent = 'Güncelle';
        cancelEditButton.style.display = 'inline-block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function resetFormToCreateMode() {
        editingReservationId = null;
        newReservationForm.reset();
        formTitle.textContent = 'Yeni Rezervasyon Yap';
        formSubmitButton.textContent = 'Rezervasyon Yap';
        cancelEditButton.style.display = 'none';
        setMinStartDate();
        reservationError.textContent = '';
        conflictWarningElement.style.display = 'none';
        conflictWarningElement.textContent = '';
    }

    // --- Delete Handling ---
    async function handleDelete(reservationId) {
        const currentUser = getUserFromToken(getToken());
        if (!currentUser) { console.warn("Cannot delete, user not logged in."); return; }

        if (!confirm('Bu rezervasyonu silmek istediğinizden emin misiniz?')) return;

        reservationError.textContent = '';
        showLoading();
        try {
            const result = await apiFetch(`/reservations/${reservationId}`, { method: 'DELETE' });
            console.log('Deletion successful:', result.message);
            if (calendar) calendar.refetchEvents();
        } catch (error) {
            console.error('Rezervasyon silinirken hata:', error);
             if (!error.message.includes('Authentication required')) {
                reservationError.textContent = `Rezervasyon silinemedi: ${error.message}`;
            }
        } finally {
             hideLoading();
        }
    }

    // --- Form Submission (Handles BOTH Create and Update) ---
    newReservationForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const reservationError = document.getElementById('reservation-error');
        reservationError.textContent = '';
        reservationError.classList.remove('show');
        showLoading();

        let operation = '';

        // --- Revert to reading separate date/time inputs --- 
        const department = document.getElementById('department').value;
        const startDate = document.getElementById('start-date').value;
        const startTime = document.getElementById('start-time').value;
        const endDate = document.getElementById('end-date').value;
        const endTime = document.getElementById('end-time').value;
        // Use the ID 'aciklama' from the attached index.html
        const description = document.getElementById('aciklama').value.trim(); 

        // Basic validation for separate date/time
        if (!department || !startDate || !startTime || !endDate || !endTime) {
             reservationError.textContent = 'Lütfen departman ve tüm tarih/saat alanlarını doldurun.';
             reservationError.classList.add('show');
             hideLoading();
             return;
         }

        // Combine date and time, then convert to ISO string
        const startDateTimeString = `${startDate}T${startTime}:00`;
        const endDateTimeString = `${endDate}T${endTime}:00`;

        // Date validation using combined strings
        const startDateTime = new Date(startDateTimeString);
        const endDateTime = new Date(endDateTimeString);
        const now = new Date();

        if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
             reservationError.textContent = 'Geçersiz tarih veya saat formatı.';
             reservationError.classList.add('show');
             hideLoading();
             return;
        }
         if (startDateTime < now && (startDateTime.getTime() + 1000 < now.getTime())) { // Allow starting now
             reservationError.textContent = 'Başlangıç zamanı geçmişte olamaz.';
             reservationError.classList.add('show');
             hideLoading();
             return;
        }
        if (endDateTime <= startDateTime) {
             reservationError.textContent = 'Bitiş zamanı, başlangıçtan sonra olmalıdır.';
             reservationError.classList.add('show');
             hideLoading();
            return;
        }

        const reservationData = {
            department,
            startDateTime: startDateTimeString, // Send combined string (backend expects ISO-like)
            endDateTime: endDateTimeString,   // Send combined string
            description
        };

        const editingReservationId = newReservationForm.dataset.editingId;

        try {
             // Check for conflicts before submitting (using combined strings)
            let conflictCheckEndpoint = `/reservations/check?start=${encodeURIComponent(startDateTimeString)}&end=${encodeURIComponent(endDateTimeString)}`;
             if (editingReservationId) {
                conflictCheckEndpoint += `&excludeId=${editingReservationId}`;
            }
            const conflictResult = await apiFetch(conflictCheckEndpoint);

            if (conflictResult.conflict) {
                reservationError.textContent = 'Seçilen zaman aralığında araç zaten rezerve edilmiş!';
                reservationError.classList.add('show');
                hideLoading();
                return; // Stop submission
            }

            // Proceed with submission if no conflict
            let result;
            if (editingReservationId) {
                // UPDATE
                operation = 'güncellenirken';
                result = await apiFetch(`/reservations/${editingReservationId}`, {
                    method: 'PUT',
                    body: JSON.stringify(reservationData)
                });
                newReservationForm.removeAttribute('data-editing-id');
                resetFormToCreateMode(); // Reset form after update
                alert('Rezervasyon başarıyla güncellendi!');
            } else {
                // CREATE
                operation = 'kaydedilirken';
                result = await apiFetch('/reservations', {
                    method: 'POST',
                    body: JSON.stringify(reservationData)
                });
                newReservationForm.reset();
                setMinStartDate(); // Reset min date/time inputs
                 alert('Rezervasyon başarıyla oluşturuldu!');
            }

            console.log(`Reservation ${editingReservationId ? 'updated' : 'created'}:`, result);
            calendar.refetchEvents();

        } catch (error) {
            console.error(`Error while ${operation} reservation:`, error);
            reservationError.textContent = `Rezervasyon ${operation} bir hata oluştu: ${error.message || 'Lütfen tekrar deneyin.'}`;
             reservationError.classList.add('show');
        } finally {
            hideLoading();
        }
    });


    // --- Utility Functions ---
    function formatDateTime(dateTimeString) {
         if (!dateTimeString) return ''; try { const date = new Date(dateTimeString); const day = String(date.getDate()).padStart(2, '0'); const month = String(date.getMonth() + 1).padStart(2, '0'); const year = date.getFullYear(); const hours = String(date.getHours()).padStart(2, '0'); const minutes = String(date.getMinutes()).padStart(2, '0'); return `${day}.${month}.${year} ${hours}:${minutes}`; } catch (e) { console.error("Error formatting date:", dateTimeString, e); return "Geçersiz Tarih"; }
    }

    function setMinStartDate() { const today = new Date(); today.setMinutes(today.getMinutes() - today.getTimezoneOffset()); const todayString = today.toISOString().split('T')[0]; startDateInput.min = todayString; endDateInput.min = todayString; }
    startDateInput.addEventListener('change', () => { if (startDateInput.value) { endDateInput.min = startDateInput.value; if (endDateInput.value && endDateInput.value < startDateInput.value) { endDateInput.value = ''; } } else { setMinStartDate(); } });

    // Helper function to generate a random pastel color
    function getRandomColor() {
        const hue = Math.floor(Math.random() * 360);
        const saturation = Math.floor(Math.random() * 30) + 70; // 70-100% saturation
        const lightness = Math.floor(Math.random() * 10) + 65; // 65-75% lightness
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }

    // --- NEW UTILITY FUNCTIONS FOR TEXT CONTRAST (Placed Correctly) ---
    function hslToRgb(h, s, l){
        let r, g, b;
        h /= 360; 
        if(s == 0){ r = g = b = l; } else {
            function hue2rgb(p, q, t){
                if(t < 0) t += 1; if(t > 1) t -= 1;
                if(t < 1/6) return p + (q - p) * 6 * t;
                if(t < 1/2) return q;
                if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            }
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }

    function getLuminance(r, g, b) {
        const a = [r, g, b].map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
        return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    }

    function getTextColorForBg(hslColor) {
        const parts = hslColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
        if (!parts) return '#000000';
        const h = parseInt(parts[1], 10);
        const s = parseInt(parts[2], 10) / 100;
        const l = parseInt(parts[3], 10) / 100;
        const [r, g, b] = hslToRgb(h, s, l);
        const luminance = getLuminance(r, g, b);
        return luminance > 0.55 ? '#000000' : '#ffffff';
    }
    // --- End of New Utility Functions ---

    // --- Weather Fetch Function (Added) ---
    async function fetchWeatherData() {
        if (!weatherApiKey || !weatherCityElement) {
            console.warn("Weather API key or elements missing.");
            return;
        }

        const weatherApiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${weatherCity}&appid=${weatherApiKey}&units=${weatherUnits}&lang=${weatherLang}`;

        try {
            const response = await fetch(weatherApiUrl);
            if (!response.ok) {
                throw new Error(`Weather API error: ${response.statusText}`);
            }
            const data = await response.json();

            console.log("Weather Data:", data);

            if (data.main && data.weather && data.weather[0]) {
                weatherTempElement.textContent = Math.round(data.main.temp);
                weatherDescElement.textContent = data.weather[0].description;
                weatherCityElement.textContent = data.name;
                // Set weather icon
                const iconCode = data.weather[0].icon;
                weatherIconElement.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
                weatherIconElement.alt = data.weather[0].description;
            }

        } catch (error) {
            console.error("Error fetching weather data:", error);
            // Optionally hide or show error in the widget
            if(weatherDescElement) weatherDescElement.textContent = "Hava durumu alınamadı";
        }
    }

    // --- Currency Fetch Function (Updated) ---
    async function fetchCurrencyRates() {
        if (!rateUsdElement || !rateEurElement || !rateGbpElement || !iconUsdElement || !iconEurElement || !iconGbpElement) {
            console.warn("Currency rate or icon elements missing.");
            return;
        }
        const currencyApiUrl = 'https://api.frankfurter.app/latest?from=EUR&to=USD,GBP,TRY';

        // Get previous rates from localStorage
        const previousRatesStr = localStorage.getItem('previousCurrencyRates');
        const previousRates = previousRatesStr ? JSON.parse(previousRatesStr) : {};

        try {
            const response = await fetch(currencyApiUrl);
            if (!response.ok) throw new Error(`Currency API error: ${response.statusText}`);
            const data = await response.json();
            console.log("Currency Data:", data);

            if (data.rates && data.rates.TRY && data.rates.USD && data.rates.GBP) {
                const rateTRY = data.rates.TRY;
                const rateUSD_EUR = data.rates.USD;
                const rateGBP_EUR = data.rates.GBP;

                const currentRates = {
                    EUR: rateTRY,
                    USD: rateTRY / rateUSD_EUR,
                    GBP: rateTRY / rateGBP_EUR
                };

                // Update UI and icons
                updateRateUI('USD', rateUsdElement, iconUsdElement, currentRates.USD, previousRates.USD);
                updateRateUI('EUR', rateEurElement, iconEurElement, currentRates.EUR, previousRates.EUR);
                updateRateUI('GBP', rateGbpElement, iconGbpElement, currentRates.GBP, previousRates.GBP);

                // Save current rates for next comparison
                localStorage.setItem('previousCurrencyRates', JSON.stringify(currentRates));

            } else {
                throw new Error("Required currency rates not found.");
            }

        } catch (error) {
            console.error("Error fetching/processing currency rates:", error);
            rateUsdElement.textContent = "-"; iconUsdElement.className = 'rate-change-icon fas';
            rateEurElement.textContent = "-"; iconEurElement.className = 'rate-change-icon fas';
            rateGbpElement.textContent = "-"; iconGbpElement.className = 'rate-change-icon fas';
        }
    }

    // Helper function to update rate UI including icon (Added)
    function updateRateUI(currency, valueElement, iconElement, currentRate, previousRate) {
        if (!valueElement || !iconElement) return;

        console.log(`[${currency}] Update UI: Current=${currentRate?.toFixed(4)}, Previous=${previousRate?.toFixed(4)}`); // Log rates

        valueElement.textContent = currentRate.toFixed(2);
        iconElement.className = 'rate-change-icon fas'; // Reset classes

        if (previousRate && currentRate !== previousRate) {
            console.log(`[${currency}] Rate changed!`); // Log change detection
            if (currentRate > previousRate) {
                iconElement.classList.add('fa-arrow-up', 'rate-up', 'show');
                console.log(`[${currency}] Added classes:`, iconElement.className); // Log added classes
            } else {
                iconElement.classList.add('fa-arrow-down', 'rate-down', 'show');
                console.log(`[${currency}] Added classes:`, iconElement.className); // Log added classes
            }
        } else {
            console.log(`[${currency}] No change or no previous rate.`); // Log no change
        }
    }

    function initializeApp() {
        console.log("Initializing app (JWT mode)...");
        const token = getToken();
        const user = getUserFromToken(token);

        // Apply saved theme or default to light
        const savedTheme = localStorage.getItem('theme') || 'light';
        applyTheme(savedTheme);

        if (user) {
             if (user.exp * 1000 < Date.now()) {
                  console.log("Token expired. Logging out.");
                  handleLogout();
             } else {
                  console.log("User logged in via token:", user.email);
                  showAppScreen(user);
            }
        } else {
            console.log("No valid token found. Showing login screen.");
            showLoginScreen();
        }
    setMinStartDate();
    }

    initializeApp();

    darkModeToggleButton.addEventListener('click', toggleTheme); // Added listener for theme toggle

});
