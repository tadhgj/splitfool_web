$(document).ready(function() {

    // ignore hover on mobile devices
    // https://stackoverflow.com/a/30303898
    function watchForHover() {
        var hasHoverClass = false;
        var container = document.body;
        var lastTouchTime = 0;

        function enableHover() {
            // filter emulated events coming from touch events
            if (new Date() - lastTouchTime < 500) return;
            if (hasHoverClass) return;

            container.className += ' hasHover';
            hasHoverClass = true;
        }

        function disableHover() {
            if (!hasHoverClass) return;

            container.className = container.className.replace(' hasHover', '');
            hasHoverClass = false;
        }

        function updateLastTouchTime() {
            lastTouchTime = new Date();
        }

        document.addEventListener('touchstart', updateLastTouchTime, true);
        document.addEventListener('touchstart', disableHover, true);
        document.addEventListener('mousemove', enableHover, true);

        enableHover();
    }
    watchForHover();

    function setCookie(cname, cvalue, exdays) {
        const d = new Date();
        d.setTime(d.getTime() + (exdays*24*60*60*1000));
        let expires = "expires="+ d.toUTCString();
        // debug print length of cooke
        console.log("Setting cookie " + cname + " with length " + cvalue.length);
        document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
        document.getElementById("exportCookiesValue").value = cvalue; // set export input value to cookie value for easy copying
    }

    function getCookie(cname) {
        let name = cname + "=";
        let decodedCookie = decodeURIComponent(document.cookie);
        let ca = decodedCookie.split(';');
        for(let i = 0; i <ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    }

    function saveDataToCookies() {
        var all = {
            "billTotal": $('#billTotal').val(),
            "peopleList": peopleList
        }
        var allString = JSON.stringify(all);
        setCookie("allData", allString, 30); // expires in 30 days
    }

    var list = [];

    var peopleList = [];

    // read peopleList from cookies
    function readDataFromCookies() {
        var allDataString = getCookie("allData");
        if (allDataString) {
            try {
                var allData = JSON.parse(allDataString);
                if (allData.billTotal) {
                    $('#billTotal').val(allData.billTotal);
                }
                if (allData.peopleList) {
                    peopleList = allData.peopleList;
                    updatePersonListDisplay();
                }
            }
            catch(err) {
                console.log("Error parsing saved allData from cookies: " + err);
            }
        }
    }

    // on start
    readDataFromCookies();
    parsePersonInputChange();

    // on import cookies button click
    $('#importCookiesBtn').click(function() {
        var importedDataString = $('#importCookiesValue').val();
        if (importedDataString) {
            try {
                var allData = JSON.parse(importedDataString);
                if (allData.billTotal) {
                    $('#billTotal').val(allData.billTotal);
                }
                if (allData.peopleList) {
                    peopleList = allData.peopleList;
                    updatePersonListDisplay();
                }
                // save to cookies
                saveDataToCookies();
            }
            catch(err) {
                console.log("Error parsing imported data: " + err);
                alert("Error parsing imported data. Please make sure you pasted the correct exported data.");
            }
        }
    });

    // on update
    $('#newPerson').on('input', function() {
        var inputVal = $(this).val();
        parsePersonInputChange(inputVal);
    });

    function parsePersonInputChange(newInput=null) {
        var inputInternal = newInput !== null ? newInput : $('#newPerson').val();

        if (inputInternal.length > 0) {
            // valid input
            $('#addPersonBtn').prop('disabled', false);
        } else {
            // invalid input
            $('#addPersonBtn').prop('disabled', true);
        }
    }

    $('#personList').on('input', '.personItemCostInput', function() {
        var personId = $(this).closest('.person').attr('id').split('-')[1];
        var inputVal = $(this).val();
        console.log("Person ID on input: " + personId);
        parsePersonItemInputChange(inputVal, personId);
    });

    function parsePersonItemInputChange(newInput=null, personId=null) {
        if (personId === null) {
            return;
        }
        console.log("Parsing person item input change for person ID: " + personId);
        var inputInternal = newInput !== null ? newInput : $(`#personItemCostInput-${personId}`).val();

        if (inputInternal.length > 0 && !isNaN(inputInternal) && parseFloat(inputInternal) > 0) {
            // valid input
            $(`.addPersonItemBtn[data-id='${personId}']`).prop('disabled', false);
        } else {
            // invalid input
            $(`.addPersonItemBtn[data-id='${personId}']`).prop('disabled', true);
        }
    }

    // on add person button click
    $('#addPersonBtn').click(function() {
        var personName = $('#newPerson').val();
        if(personName) {
            addNewPerson(personName);
        } else {

        }
    });

    // on 'enter' key press in input field
    $('#newPerson').keypress(function(e) {
        if(e.which == 13) { // Enter key code
            var personName = $('#newPerson').val();
            if(personName) {
                addNewPerson(personName);
            }
        }
    });

    // on 'enter' mobile
    $('#newPerson').on('keydown', function(e) {
        if(e.key === 'Enter') {
            var personName = $('#newPerson').val();
            if(personName) {
                addNewPerson(personName);
            }
        }
    });

    function addNewPerson(name) {
        // check if name is empty
        if (!name.trim()) {
            return;
        }

        peopleList.push({
            name: name,
            id: peopleList.length + 1,
            items: [],
            paid: null
        });

        $('#newPerson').val('');
        parsePersonInputChange('');
        updatePersonListDisplay();
    }

    function updatePersonListDisplay() {
        $('#personList').empty();
        peopleList.forEach(function(person) {

            var personItems = person.items;
            var personItemsTotalValue = 0;
            var personItemsHTML = '';
            personItems.forEach(function(item, index) {

                // check if cost is valid
                if (isNaN(item.cost) || item.cost <= 0) {
                    return; // skip invalid cost items
                }
                // process each item
                personItemsTotalValue += item.cost;

                personItemName = `<span class="personItemName" contenteditable>${item.name}</span>`;
                if (!item.name || item.name.trim() === '') {
                    personItemName = ``;
                }
                personItemsHTML += `
                    <div class="personItem" id="personItem-${person.id}-${index}">
                        <span class="personItemCost" contenteditable>${item.cost.toFixed(2)}</span>
                        ${personItemName}
                        <button class="removeItemBtn" data-person-id="${person.id}" data-item-index="${index}">Remove</button>
                    </div>
                `;
            });
            // use multi-line template literals
            var personPaidValue = person.paid != null ? person.paid.toFixed(2) : '';
            var personDiv = $(`
                <div class="person" id="person-${person.id}">
                    <div class="personNameSection">
                        <span id="personNameInput-${person.id}" class="personName" contenteditable>${person.name}</span>
                        <div style="flex-grow:1;"></div>
                        <label class="input-sizer" data-value="${personPaidValue}">
                            <span class="personPaidLabel">Paid: $</span>
                            <input type="text" size="1" class="personPaidInput" id="personPaidInput-${person.id}" placeholder="-.--" value="${personPaidValue}" onInput="this.parentNode.dataset.value = this.value">
                        </label>
                    </div>
                    <div class="topRowExpenseList">
                        <span>Items</span>
                        <hr>
                        <span class="personTotalValue">$${personItemsTotalValue.toFixed(2)}</span>
                    </div>
                    <div class="personItems">
                        ${personItemsHTML}
                    </div>
                    <div class="addItemContainer">
                        <button class="showAddItemBtn" data-id="${person.id}">Add Item</button>
                    </div>
                    <button class="removePersonBtn" data-id="${person.id}">Remove</button>
                </div>
            `);

                        // <span class="personExpenseListTitle">Add item</span>
                        // <div class="addPersonItemSection">
                        //     <input type="number" min="0.01" step="0.01" class="personItemCostInput" id="personItemCostInput-${person.id}" placeholder="cost ($)">
                        //     <input type="text" class="personItemNameInput" id="personItemNameInput-${person.id}" placeholder="name (optional)">
                        //     <button class="addPersonItemBtn" data-id="${person.id}" disabled="true">Add Item</button>
                        // </div>
            $('#personList').append(personDiv);
        });

        processBill();

        // save peopleList to cookies
        saveDataToCookies();
    }

    // delegate remove person button click
    $('#personList').on('click', '.removePersonBtn', function() {
        var personId = $(this).data('id');
        peopleList = peopleList.filter(function(person) {
            return person.id !== personId;
        });
        updatePersonListDisplay();
    });

    // on enter of new item cost
    $('#personList').on('keypress', '.personItemCostInput', function(e) {
        if(e.which == 13) { // Enter key code
            // switch focus on personItemNameInput
            var personId = $(this).closest('.person').attr('id').split('-')[1];
            $(`#personItemNameInput-${personId}`).focus();
        }
    });

    // on enter of new item name
    $('#personList').on('keypress', '.personItemNameInput', function(e) {
        if(e.which == 13) { // Enter key code
            var personId = $(this).closest('.person').attr('id').split('-')[1];
            addItemToPerson(parseInt(personId));
        }
    });

    // on button click of new item add
    $('#personList').on('click', '.addPersonItemBtn', function() {
        var personId = $(this).data('id');
        addItemToPerson(personId);
    });

    // on button click of green 'add item' button
    $('body').on('click', '.showAddItemBtn', function() {
        var personId = $(this).data('id');
        // remove this button
        $('.showAddItemBtn[data-id="' + personId + '"]').remove();
        // create add item section
        var addItemSection = $(`
            <div class="addPersonItemSection">
                <input type="number" min="0.01" step="0.01" class="personItemCostInput" id="personItemCostInput-${personId}" placeholder="cost ($)">
                <input type="text" class="personItemNameInput" id="personItemNameInput-${personId}" placeholder="name (optional)">
                <button class="addPersonItemBtn" data-id="${personId}" disabled="true">Add Item</button>
            </div>
        `);
        $("#person-" + personId + " .addItemContainer").append(addItemSection);
        // focus on cost input
        $(`#personItemCostInput-${personId}`).focus();
    });

    function addItemToPerson(personId) {
        // get input values
        var itemCostInput = $(`#personItemCostInput-${personId}`).val();
        var itemNameInput = $(`#personItemNameInput-${personId}`).val();
        var itemCostFloat = 0;
        // quit if cost input is invalid
        if (!itemCostInput || isNaN(itemCostInput) || parseFloat(itemCostInput) <= 0) {
            console.log("Invalid cost input");
            return;
        }

        try {
            itemCostFloat = parseFloat(itemCostInput);
        } catch(err) {
            console.log("Invalid cost input: " + itemCostInput);
            return;
        }

        var person = peopleList.find(function(p) { return p.id === personId; });
        if(person) {
            person.items.push({
                name: itemNameInput,
                cost: itemCostFloat
            });
            updatePersonListDisplay();
            // remove add item section
            $(`#person-${personId} .addPersonItemSection`).remove();
            // add back the show add item button only if updatePersonListDisplay didn't already add it
            // var showAddItemBtn = $(`<button class="showAddItemBtn" data-id="${personId}">Add Item</button>`);
            // $(`#person-${personId} .addItemContainer`).append(showAddItemBtn);

        } else {
            console.log("Person not found for ID: " + personId);
        }
    }

    // delegate remove item button click
    $('#personList').on('click', '.removeItemBtn', function() {
        var personId = $(this).data('person-id');
        var itemIndex = $(this).data('item-index');
        var person = peopleList.find(function(p) { return p.id === personId; });
        if(person) {
            // remove item at index
            person.items.splice(itemIndex, 1);
            updatePersonListDisplay();
        }
        else {
            console.log("Person not found for ID: " + personId);
        }
    });


    function setOnChangeOfPaidInput(personId) {
        var paidValueInput = $(`#personPaidInput-${personId}`).val();
        var paidValueFloat = 0;
        try {
            paidValueFloat = parseFloat(paidValueInput);
        } catch(err) {
            console.log("Invalid paid input: " + paidValueInput);
            return;
        }
        var person = peopleList.find(function(p) { return p.id === parseInt(personId); });
        if(person) {
            person.paid = paidValueFloat;
            processBill();
        } else {
            console.log("Person not found for ID: " + personId);
        }
    }

    // on change of paid input
    $('#personList').on('input', '.personPaidInput', function() {
        var personId = $(this).closest('.person').attr('id').split('-')[1];
        setOnChangeOfPaidInput(personId);
    });

    function processBill(newValue) {
        console.log("Processing bill");

        if (newValue === undefined) {
            newValue = $('#billTotal').val();
        }

        // generate output here
        $('#outputSection').empty();
        if (isNaN(newValue) || newValue <= 0) {
            $('#outputSection').text('Please enter a valid bill amount greater than $0.');
            return;
        }

        var totalBill = parseFloat(newValue);
        var totalExpenses = 0;
        peopleList.forEach(function(person) {
            var personTotal = 0;
            person.items.forEach(function(item) {
                personTotal += item.cost;
            });
            totalExpenses += personTotal;
        });

        if (totalExpenses === 0) {
            $('#outputSection').text('No expenses recorded for any person.');
            return;
        }

        $('#outputSection').append(`<p>Total Bill: $${totalBill.toFixed(2)}</p>`);
        $('#outputSection').append(`<p>Total Expenses Recorded: $${totalExpenses.toFixed(2)}</p>`); 

        // calculate diff. between total bill and total expenses
        var diff = totalBill - totalExpenses;
        if (diff > 0) {
            $('#outputSection').append(`<p>Note: Total bill exceeds total expenses by $${diff.toFixed(2)}. (Likely tax / tip) Each person's share will be calculated based on their expenses.</p>`);
        } else if (diff < 0) {
            $('#outputSection').append(`<p>Note: Total expenses exceed total bill by $${(-diff).toFixed(2)}. (Weird) Each person's share will be calculated based on their expenses.</p>`);
        }
        var didAnyonePay = false;
        peopleList.forEach(function(person) {
            var personTotal = 0;
            var personPaid = person.paid || 0;
            if (personPaid > 0) {
                didAnyonePay = true;
            }
            person.items.forEach(function(item) {
                personTotal += item.cost;
            });
            var share = (personTotal / totalExpenses) * totalBill;
            var percentageOfExpenses = (personTotal / totalExpenses) * 100;
            $('#outputSection').append(`<p>${person.name} (${percentageOfExpenses.toFixed(2)}%) owes: $${share.toFixed(2)} (based on expenses of $${personTotal.toFixed(2)})</p>`);
        });

        if (didAnyonePay) {
            $('#outputSection').append('<h3>Settlements:</h3>');
            peopleList.forEach(function(person) {
                var personTotal = 0;
                var personPaid = person.paid || 0;
                person.items.forEach(function(item) {
                    personTotal += item.cost;
                });
                var share = (personTotal / totalExpenses) * totalBill;
                var balance = personPaid - share;
                if (balance > 0) {
                    $('#outputSection').append(`<p>${person.name} should receive $${balance.toFixed(2)}</p>`);
                } else if (balance < 0) {
                    $('#outputSection').append(`<p>${person.name} should pay $${(-balance).toFixed(2)}</p>`);
                } else {
                    $('#outputSection').append(`<p>${person.name} is settled up.</p>`);
                }
            });

            // check if paid amounts match total bill
            var totalPaid = 0;
            peopleList.forEach(function(person) {
                totalPaid += person.paid || 0;
            });
            if (Math.abs(totalPaid - totalBill) > 0.01) {
                $('#outputSection').append(`<p style="color:red;">Warning: Total paid amount ($${totalPaid.toFixed(2)}) does not match total bill amount ($${totalBill.toFixed(2)}).</p>`);
            }
        }

        // save bill total to cookies
        saveDataToCookies();
    }

    // on update of bill
    $('#billTotal').on('input', function() {
        var billTotalInput = $(this).val();
        processBill(billTotalInput);
    });

    // clear cookies button
    $('#clearCookiesBtn').click(function() {
        // alert "are you sure?"
        if (!confirm("Are you sure you want to clear all saved data? This action cannot be undone.")) {
            return;
        }
        // clear cookies
        setCookie("allData", "", -1); // set cookie to expire in the past
        // clear peopleList
        peopleList = [];
        // clear bill total
        $('#billTotal').val('');
        // update display
        updatePersonListDisplay();
        processBill();
    });

});
    