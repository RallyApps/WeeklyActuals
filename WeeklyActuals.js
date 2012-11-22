function WeeklyActuals() {
    var rallyDataSource;
    var userHash;
    var taskHash;
    var dropdown;
    var waiter;

    function Hash() {
        this._hash = {};
    }

    Hash.prototype.set = function(i, j, v) {
        if (this._hash[i] === undefined) {
            this._hash[i] = {};
        }
        this._hash[i][j] = v;


    };

    Hash.prototype.get = function(i, j) {
        if (this._hash[i] === undefined) {
            this._hash[i] = {};
        }
        if (this._hash[i][j] === undefined) {
            this._hash[i][j] = 0;
        }
        return this._hash[i][j];
    };

    function parseRallyDate(dateStr) {
        var day = dateStr.slice(8, 10);
        var month = dateStr.slice(5, 7) - 1;
        var year = dateStr.slice(0, 4);
        var hour = dateStr.slice(11, 13);
        var min = dateStr.slice(14, 16);
        var sec = dateStr.slice(17, 19);
        var date = new Date(year, month, day, hour, min, sec);
        date.setTime(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
        date.setHours(0);
        date.setMinutes(0);
        date.setSeconds(0);
        date.setMilliseconds(0);
        return date;
    }

    function processRevisions(task, revs, owner, project) {

        // MJR changed, removed the units and just put in a placeholder
        var regExp1 = /ACTUALS added \[([0-9\.]*) [A-Za-z]*\]/;
        var regExp2 = /ACTUALS changed from \[([0-9\.]*) [A-Za-z]*\] to \[([0-9\.]*) [A-Za-z]*\]/;
        var regExp3 = /OWNER added \[([a-z\@\.]*)\]/;
        var regExp4 = /OWNER changed from \[([a-z\@\.]*)\] to \[([a-z\@\.]*)\]/;

        for (var r in revs) {
            if(revs.hasOwnProperty(r)) {
                var rev = revs[r];

                var ownerName;

                if (!owner) {
                    ownerName = "No Owner";
                } else {
                    ownerName = owner.DisplayName;
                }

                r = regExp1.exec(rev.Description);
                if (r) {
                    userHash.set(ownerName, project,
                            userHash.get(ownerName, project) + parseFloat(r[1]));
                    userHash.set(ownerName, 'Total',
                            userHash.get(ownerName, 'Total') + parseFloat(r[1]));
                    userHash.set('Total', project,
                            userHash.get('Total', project) + parseFloat(r[1]));

                    taskHash.set(task.FormattedID, 'Actuals',
                            taskHash.get(task.FormattedID, 'Actuals') + parseFloat(r[1]));
                }

                r = regExp2.exec(rev.Description);
                if (r) {
                    userHash.set(ownerName, project,
                            userHash.get(ownerName, project) + parseFloat(r[2]) - parseFloat(r[1]));
                    userHash.set(ownerName, 'Total',
                            userHash.get(ownerName, 'Total') + parseFloat(r[2]) - parseFloat(r[1]));
                    userHash.set('Total', project,
                            userHash.get('Total', project) + parseFloat(r[2]) - parseFloat(r[1]));

                    taskHash.set(task.FormattedID, 'Actuals',
                            taskHash.get(task.FormattedID, 'Actuals') + (parseFloat(r[2]) - parseFloat(r[1])));
                }
                r = regExp3.exec(rev.Description);
                if (r) {
                    ownerName = r[1];
                }
                r = regExp4.exec(rev.Description);
                if (r) {
                    ownerName = r[1];
                }
            }
        }
    }

    function getWorkProduct(array, task) {
        var ref = task.WorkProduct._ref;
        var id = /(\d+)\.js/.exec(ref)[1];
        for (var i in array) {
            if (array[i].ObjectID == id) {
                return array[i];
            }
        }
        return undefined;
    }

    function getRevisionHistory(array, task) {
        var ref = task.RevisionHistory._ref;
        var rhId = /(\d+)\.js/.exec(ref)[1];
        for (var i in array) {
            if (array[i].ObjectID == rhId) {
                return array[i].Revisions;
            }
        }
        return undefined;
    }

    function getTask(array, formattedID) {
        for (var i in array) {
            if (array[i].FormattedID == formattedID) {
                return array[i];
            }
        }
        return undefined;
    }

    function genUserTable(results) {
        var cmpProject = function(a, b) {
            if (a._ref < b._ref) {
                return -1;
            }
            else if (a._ref == b._ref) {
                return 0;
            }
            else {
                return 1;
            }
        };

        var cmpUser = function(a, b) {
            if (a.DisplayName < b.DisplayName) {
                return -1;
            }
            else if (a.DisplayName == b.DisplayName) {
                return 0;
            }
            else {
                return 1;
            }
        };

        // MJR - changed wording
        var tbl = '<div class="title">Actuals By User</div>';
        tbl += '<table class="data-table" border="0" cellpadding="0" cellspacing="0">';
        tbl += '<tr><th class="center">User</th><th class="center">Total</th>';

        for (var p in results.projects.sort(cmpProject)) {
            if (userHash.get('Total', results.projects[p]._ref) > 0) {
                // MJR - Put more of the name here
                tbl += '<th class="center">';
                if (results.projects[p]._refObjectName.length > 20) {
                    tbl += "...";
                }
                tbl += results.projects[p]._refObjectName.substr(-20) + "</th>";
            }
        }


        var userCounter = 0;

        tbl += '</tr>';

        for (var u in results.users.sort(cmpUser)) {
            if(results.users.hasOwnProperty(u)) {
                var days;

                if (userHash.get(results.users[u].DisplayName, 'Total') > 0) {
                    userCounter += 1;
                    tbl += '<tr>';
                    tbl += '<td class="left">' + results.users[u].DisplayName + '</td>';

                    days = userHash.get(results.users[u].DisplayName, 'Total');
                    if (days > 0.0) {
                        tbl += '<td class="center highlite-good">' + days + '</td>';
                    }
                    else {
                        tbl += '<td class="center">' + days + '</td>';
                    }
                    for (var p2 in results.projects.sort(cmpProject)) {
                        if (userHash.get('Total', results.projects[p2]._ref) > 0) {
                            days = userHash.get(results.users[u].DisplayName, results.projects[p2]._ref);
                            if (days > 0.0) {
                                tbl += '<td class="center highlite-good">' + days + '</td>';
                            }
                            else {
                                tbl += '<td class="center">' + days + '</td>';
                            }
                        }
                    }
                    tbl += '</tr>';
                }
            }
        }
        if (userCounter === 0) {
            tbl += '<tr><td>No Actuals found on Tasks or no Tasks found</td></tr>';
        }

        tbl += '</table>';
        document.getElementById('user-table-div').innerHTML = tbl;
    }

    function taskRow(task, days) {
        var ownerName;
        if (!task.Owner) {
            ownerName = "No Owner";
        } else {
            ownerName = task.Owner.DisplayName;
        }

        var tbl = '<tr>';
        tbl += '<td class="left">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + task.FormattedID + '</td>';
        tbl += '<td class="left">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + task.Name + '</td>';
        tbl += '<td class="center"><table class="state-table"><tr>';
        tbl += '<td class="none"><div>-</div></td>';
        // defined state
        if ((task.State == "Defined") && (task.Blocked)) {
            c = "blocked";
        }
        else if ((task.State == "Defined") || (task.State == "In-Progress") || (task.State == "Completed")) {
            c = "selected";
        }
        else {
            c = "";
        }
        tbl += '<td class="' + c + '"><div>D</div></td>';
        // in-progress state
        if ((task.State == "In-Progress") && (task.Blocked)) {
            c = "blocked";
        }
        else if ((task.State == "In-Progress") || (task.State == "Completed")) {
            c = "selected";
        }
        else {
            c = "";
        }
        tbl += '<td class="' + c + '"><div>P</div></td>';
        // completed state
        if ((task.State == "Completed") && (task.Blocked)) {
            c = "blocked";
        }
        else if (task.State == "Completed") {
            c = "selected";
        }
        else {
            c = "";
        }
        tbl += '<td class="' + c + '"><div>C</div></td>';
        tbl += '</tr></table></td>';
        tbl += '<td class="center">' + ((days > 0) ? "+" : "") + days + '</td>';
        tbl += '<td class="center">' + task.Project._refObjectName + '</td>';
        tbl += '<td class="center">' + ownerName + '</td>';
        tbl += '</tr>';
        return tbl;
    }

    function storyRow(story) {
        var ownerName;
        if (!story.Owner) {
            ownerName = "No Owner";
        } else {
            ownerName = story.Owner.DisplayName;
        }

        var tbl = '<tr>';
        tbl += '<td>' + story.FormattedID + '</td>';
        tbl += '<td>' + story.Name + '</td>';
        tbl += '<td class="center"><table class="state-table"><tr>';
        // defined state
        if ((story.ScheduleState == "Defined") && (story.Blocked)) {
            c = "blocked";
        }
        else if ((story.ScheduleState == "Defined") || (story.ScheduleState == "In-Progress") ||
                (story.ScheduleState == "Completed") || (story.ScheduleState == "Accepted")) {
            c = "selected";
        }
        else {
            c = "";
        }
        tbl += '<td class="' + c + '"><div>D</div></td>';
        // in-progress state
        if ((story.ScheduleState == "In-Progress") && (story.Blocked)) {
            c = "blocked";
        }
        else if ((story.ScheduleState == "In-Progress") || (story.ScheduleState == "Completed") ||
                (story.ScheduleState == "Accepted")) {
            c = "selected";
        }
        else {
            c = "";
        }
        tbl += '<td class="' + c + '"><div>P</div></td>';
        // completed state
        if ((story.ScheduleState == "Completed") && (story.Blocked)) {
            c = "blocked";
        }
        else if ((story.ScheduleState == "Completed") || (story.ScheduleState == "Accepted")) {
            c = "selected";
        }
        else {
            c = "";
        }
        tbl += '<td class="' + c + '"><div>C</div></td>';
        // accepted state
        if ((story.ScheduleState == "Accepted") && (story.Blocked)) {
            c = "blocked";
        }
        else if (story.ScheduleState == "Accepted") {
            c = "selected";
        }
        else {
            c = "";
        }
        tbl += '<td class="' + c + '"><div>A</div></td>';
        tbl += '</tr></table></td>';
        tbl += '<td class="center"></td>';
        tbl += '<td class="center">' + story.Project._refObjectName + '</td>';
        tbl += '<td class="center">' + ownerName + '</td>';
        tbl += '</tr>';
        return tbl;
    }

    function genTaskTable(results) {

        var cmpTask = function(a, b) {
            wpa = taskHash.get(a, 'wp');
            wpb = taskHash.get(b, 'wp');
            if (wpa && wpb) {
                if (wpa.FormattedID < wpb.FormattedID) {
                    return -1;
                } else if (wpa.FormattedID > wpb.FormattedID) {
                    return 1;
                } else {
                    return 0;
                }
            }
            else if (wpa) {
                return -1;
            } else if (wpb) {
                return 1;
            } else {
                return 0;
            }
        };

        var tbl = '<div class="title">Tasks Actuals</div>';
        tbl += '<table class="data-table" border="0" cellpadding="0" cellspacing="0">';
        tbl += '<tr>' +
                '<th class="left">ID</th><th class="left">Name</th>' +
                '<th class="center">State</th><th class="center">Actuals</th>' +
                '<th class="center">Project</th><th class="center">Owner</th>' +
                '</tr>';

        var tids = [];
        for (var t in taskHash._hash) {
            if(taskHash._hash.hasOwnProperty(t)) {
                var task = getTask(results.tasks, t);
                var workProduct1 = getWorkProduct(results.stories, task);
                if (!workProduct1) {
                    workProduct1 = getWorkProduct(results.defects, task);
                }
                taskHash.set(t, 'task', task);
                taskHash.set(t, 'wp', workProduct1);
                tids.push(t);
            }
        }
        tids = tids.sort(cmpTask);

        var wpid = "";
        var taskCounter = 0;
        for (var t2 in tids) {
            if(tids.hasOwnProperty(t2)) {
                var days = taskHash.get(tids[t2], 'Actuals');
                var task2 = taskHash.get(tids[t2], 'task');
                var workProduct2 = taskHash.get(tids[t2], 'wp');
                var c;

                if (workProduct2) {
                    if (workProduct2.FormattedID != wpid) {
                        tbl += storyRow(workProduct2);
                        wpid = workProduct2.FormattedID;
                    }
                }
                else {
                    if (wpid != "???") {
                        tbl += '<tr><td>Unassigned</td></tr>';
                        wpid = "???";
                    }
                }
                tbl += taskRow(task2, days);
                taskCounter += 1;
            }
        }
        if (taskCounter === 0) {
            tbl += '<tr><td>No Actuals found on Tasks or no Tasks found</td></tr>';
        }

        tbl += '</table>';
        document.getElementById('task-table-div').innerHTML = tbl;
    }

    function processTasks(results) {

        userHash = new Hash();
        taskHash = new Hash();
        for (var t in results.tasks) {
            if(results.tasks.hasOwnProperty(t)) {
                var task = results.tasks[t];
                var revs = getRevisionHistory(results.revs, task);
                var owner = task.Owner;

                processRevisions(task, revs, owner, task.Project._ref);
            }
        }

        genUserTable(results);
        genTaskTable(results);
        waiter.hide();
    }

    function fetchTasks() {
        dojo.byId("user-table-div").innerHTML = '';
        dojo.byId("task-table-div").innerHTML = '';
        waiter.display("waiter");

        var today = new Date();
        var timePeriod = Number(dropdown.getValue());
        var cutoff = new Date(today.getTime() - timePeriod * 24 * 60 * 60 * 1000);
        cutoff = dojo.date.locale.format(cutoff, {selector:"date",datePattern:"yyyy-MM-dd"});

        var queryObjectArr = [];
        queryObjectArr[0] = {
            key: 'tasks',
            type: 'tasks',
            fetch: 'FormattedID,Project,Name,Owner,State,Blocked,RevisionHistory,WorkProduct,DisplayName',
            query: '(LastUpdateDate >= "' + cutoff + '")'
        };
        queryObjectArr[1] = {
            key: 'stories',
            type: 'hierarchicalrequirements',
            fetch: 'ObjectID,FormattedID,Project,Name,Owner,ScheduleState,Blocked,DisplayName',
            query: '(LastUpdateDate >= "' + cutoff + '")'
        };
        queryObjectArr[2] = {
            key: 'defects',
            type: 'defects',
            fetch: 'ObjectID,FormattedID,Project,Name,Owner,ScheduleState,Blocked,DisplayName',
            query: '(LastUpdateDate >= "' + cutoff + '")'
        };
        queryObjectArr[3] = {
            key: 'revs',
            placeholder: '${tasks/revisionhistory?fetch=ObjectID,revisions}'
        };
        queryObjectArr[4] = {
            key: 'users',
            type: 'users',
            fetch: 'EmailAddress,DisplayName'
        };
        queryObjectArr[5] = {
            key: 'projects',
            type: 'projects',
            query: '(State = Open)'
        };

        rallyDataSource.findAll(queryObjectArr, processTasks);
    }


    this.display = function(element) {
        rally.sdk.ui.AppHeader.showPageTools(true);

        waiter = new rally.sdk.ui.basic.Wait({hideTarget:false});

        rallyDataSource = new rally.sdk.data.RallyDataSource('__WORKSPACE_OID__',
                '__PROJECT_OID__',
                '__PROJECT_SCOPING_UP__',
                '__PROJECT_SCOPING_DOWN__');

        var dropDownConfig = {  label: "Status for the last ",
            showLabel: true,
            defaultValue: 7};
        dropdown = new rally.sdk.ui.basic.Dropdown(dropDownConfig);
        dropdown.addEventListener("onLoad", fetchTasks);
        dropdown.addEventListener("onChange", fetchTasks);
        var data = [
            {label:"1 week", value:7},
            {label:"2 weeks", value:14},
            {label:"4 weeks", value:28},
            {label:"6 weeks", value:42}
        ];
        dropdown.setItems(data);
        dropdown.display("timePeriodSelect");
    };
}
