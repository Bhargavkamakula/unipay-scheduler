const app = {

    state: {
        userEmail: '',
        selectedFee: '',
        selectedSlotId: null,
        selectedDate: null,
        slots: []
    },

    fees: {
        'College Fee': { amount: '1,03,000' },
        'Semester Fee': { amount: '2000' },
        'Value Addition fee': { amount: '7500' }
    },

    MAX_STUDENTS_PER_SLOT: 5,

    // inclusive end date for slot availability
    END_DATE: '2026-04-04',

    init() {
        this.generateSlots();

        // set default selected date to today (YYYY-MM-DD)
        const today = new Date();
        const todayStr = today.toISOString().slice(0, 10);
        this.state.selectedDate = todayStr;

        const dateInput = document.getElementById('slot-date');
        if (dateInput) {
            dateInput.min = todayStr;
            dateInput.max = this.END_DATE;
            dateInput.value = todayStr;
        }
    },

    generateSlots() {
        // generate slots for each date from today to END_DATE inclusive
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date(this.END_DATE + 'T00:00:00');

        let idCounter = 1;

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            // skip Sundays (0)
            if (d.getDay() === 0) continue;

            const dateStr = d.toISOString().slice(0, 10);
            const dayName = d.toLocaleDateString(undefined, { weekday: 'long' });

            for (let hour = 9; hour < 17; hour++) {
                // exclude lunch hours 12 and 13 (12:00 - 13:59)
                if (hour >= 12 && hour < 14) continue;

                for (let min = 0; min < 60; min += 15) {
                    const dateTime = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hour, min);
                    const isPM = hour >= 12;
                    const displayHour = hour > 12 ? hour - 12 : hour;
                    const displayMin = min === 0 ? '00' : String(min).padStart(2, '0');
                    const timeStr = `${displayHour}:${displayMin} ${isPM ? 'PM' : 'AM'}`;

                    this.state.slots.push({
                        id: idCounter++,
                        date: dateStr,
                        day: dayName,
                        time: timeStr,
                        timestamp: dateTime.getTime(),
                        booked: Math.floor(Math.random() * 6),
                        max: this.MAX_STUDENTS_PER_SLOT
                    });
                }
            }
        }
    },

    handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('email').value;

        if (email) {
            this.state.userEmail = email;
            document.getElementById('user-email-span').innerText = email;
            document.getElementById('user-display').classList.remove('hidden');
            this.switchView('login-view', 'dashboard-view');
        }
    },

    switchView(hideId, showId) {
        document.getElementById(hideId).classList.add('hidden');
        document.getElementById(showId).classList.remove('hidden');
    },

    updateFeeDetails() {
        const feeType = document.getElementById('fee-type').value;
        this.state.selectedFee = feeType;

        const infoBox = document.getElementById('fee-info-box');
        const amountSpan = document.getElementById('fee-amount');

        if (feeType && this.fees[feeType]) {
            infoBox.classList.remove('hidden');
            amountSpan.innerText = this.fees[feeType].amount;
            this.renderSlots();
        } else {
            infoBox.classList.add('hidden');
        }

        this.updateBookButton();
    },

    renderSlots() {
        const grid = document.getElementById('slots-grid');
        grid.innerHTML = '';
        const header = document.getElementById('slots-date-header');
        const selectedDate = this.state.selectedDate;
        const todayStr = new Date().toISOString().slice(0, 10);

        if (header) {
            // show date and weekday in header
            const any = this.state.slots.find(s => s.date === selectedDate);
            header.innerText = any ? `${any.day} — ${selectedDate}` : `No slots for ${selectedDate}`;
        }

        const now = Date.now();
        const filtered = this.state.slots.filter(s => {
            if (s.date !== selectedDate) return false;
            // if user is viewing today, show only future slots
            if (selectedDate === todayStr && s.timestamp <= now) return false;
            return true;
        });

        if (filtered.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'col-span-3 text-sm text-gray-500';
            empty.innerText = 'No available slots for this date.';
            grid.appendChild(empty);
            return;
        }

        filtered.forEach(slot => {
            const isFull = slot.booked >= slot.max;
            const isSelected = this.state.selectedSlotId === slot.id;

            const div = document.createElement('div');

            let classes = "p-3 rounded-lg text-center border text-sm ";

            if (isFull) {
                classes += "bg-gray-100 text-gray-400 cursor-not-allowed";
            } else if (isSelected) {
                classes += "bg-indigo-600 text-white";
            } else {
                classes += "bg-white hover:bg-indigo-50 cursor-pointer";
            }

            div.className = classes;
            div.innerHTML = `
                <span class="font-bold">${slot.time}</span><br>
                <span class="text-xs">${isFull ? 'Full' : `${slot.booked}/${slot.max} filled`}</span>
            `;

            if (!isFull) {
                div.onclick = () => this.selectSlot(slot.id);
            }

            grid.appendChild(div);
        });
    },

    selectSlot(id) {
        this.state.selectedSlotId = id;
        this.renderSlots();

        const slot = this.state.slots.find(s => s.id === id);

        const display = `${slot.day}, ${slot.date} • ${slot.time}`;
        document.getElementById('selected-slot-display').innerText = display;
        document.getElementById('selected-slot-display').className =
            "text-indigo-700 font-bold text-lg mb-4";

        this.updateBookButton();
    },

    updateBookButton() {
        const btn = document.getElementById('book-btn');
        const isValid = this.state.selectedFee && this.state.selectedSlotId;

        btn.disabled = !isValid;

        if (isValid) {
            btn.classList.remove('bg-gray-300', 'cursor-not-allowed');
            btn.classList.add('bg-indigo-600', 'cursor-pointer');
        } else {
            btn.classList.add('bg-gray-300', 'cursor-not-allowed');
            btn.classList.remove('bg-indigo-600', 'cursor-pointer');
        }
    },

    bookSlot() {

        document.getElementById('ticket-email').innerText = this.state.userEmail;
        document.getElementById('ticket-type').innerText = this.state.selectedFee;

        const slot = this.state.slots.find(s => s.id === this.state.selectedSlotId);
        if (slot) {
            document.getElementById('ticket-time').innerText = `${slot.day}, ${slot.date} • ${slot.time}`;
        } else {
            document.getElementById('ticket-time').innerText = 'N/A';
        }

        this.switchView('dashboard-view', 'success-view');
    },

    onDateChange() {
        const d = document.getElementById('slot-date').value;
        if (!d) return;
        this.state.selectedDate = d;
        // reset selection when switching date
        this.state.selectedSlotId = null;
        document.getElementById('selected-slot-display').innerText = 'None selected';
        document.getElementById('selected-slot-display').className = 'text-gray-400 italic text-sm mb-4';
        this.renderSlots();
        this.updateBookButton();
    },

    reset() {
        this.state.selectedFee = '';
        this.state.selectedSlotId = null;

        document.getElementById('fee-type').value = "";
        document.getElementById('selected-slot-display').innerText = "None selected";
        document.getElementById('selected-slot-display').className =
            "text-gray-400 italic text-sm mb-4";

        document.getElementById('fee-info-box').classList.add('hidden');

        this.updateBookButton();
        this.switchView('success-view', 'dashboard-view');
    },

    logout() {
        location.reload();
    }
};

app.init();
