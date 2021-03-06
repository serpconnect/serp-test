Contributing
============

Licensing
---------
connect is licensed under the BSD 2-clause license. By contributing code you agree to point 1 and 3 from the [github cla](https://cla.github.com/agreement).

Documentation
-------------
Both backend and frontend documentation is available at [rtd](http://serpconnect.readthedocs.io).

Join our [slack](https://serp-group.slack.com) channel for questions and other stuff!

Depedencies
-----------
 - [nodejs](https://nodejs.org/en) (compatible with 6.1.0) and npm (bundled with nodejs)
 - (optional) `make` for some convenience

Versioning strategy
-------------------
The `master` branch receives all development work via merges from feature branches.
New releases are tagged according to [semantic versioning](http://semver.org/). 

Contributions
-------------
There are primarily two ways you can contribute to connect:
 - **Issues:** Post bug reports, feature requests and code changes as issues to the github [repo](https://github.com/emenlu/connect/issues/).
 - **Pull requests:** Well-defined (fixes one issue) pull requests are happily accepted as long as they pass the test suite. If you fix bugs please provide a test case to combat regression.   

The procedure
-------------
 - Pick the issue: It is recommended to pick existing issues but we accept contributions not related to any issue. After picking an issue, please comment and state something like "hi, i'm calling dibs on this one". This will allow people with access to update status flags and what not to reduce risk of collisions.
 - Begin by preparing for work:
  - Make sure your master is in sync: `git checkout master && git pull upstream master` 
  - Make a feature branch: `git checkout -b feature-branch`
  - [Work work](https://www.myinstants.com/instant/warcraft-peon-work-work/) and make commits
  - After that sweet sweet code we suggest you test: `mvn clean verify`
   - If, for some reason, the test doesn't work don't worry too much - the CI will test for you 
 - It's time to prepare for pull request:
  - Again, make sure master is up-to-date: `git checkout master && git pull upstream master` 
  - Forward your branch: `git checkout feature-branch && git rebase master`
 - Push to your repo: `git push origin feature-branch`
 - Make pull request from github.

Landing the PR
--------------
 - Please refer to the relevant issue and provide a clean description of your solution.
 - It is recommended (but not *required*) to rebase your commits into a clean flow (to simplify review)
 - Mention @emenlu when your PR is ready and she will assign someone to poke at it 

Students @ LTH
--------------
For students at LTH, Lunds University there exists a public Trello board [here](https://trello.com/b/5h2wb7wz/connect-open-tasks). Tasks from this board can give you some $$$ when completed.

Thanks for the interest, we hope to see you soon!
