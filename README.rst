Livetitude
##########

Live sharing of markers on maps, using Flask, CouchDB and Pusher websockets.

===========
Development
===========

Create a Pusher account.

Run a CouchDB server ::

    $ sudo aptitude install couchdb

Create a python *virtualenv* ::

    $ virtualenv --no-site-packages env
    $ source env/bin/activate

Install dependencies ::

    $ pip install -r requirements.txt

Configure your application ::

    $ cat > devenv.sh << EOF
    export DEBUG=True
    export PUSHER_ID=yourpusherid
    export PUSHER_KEY=yourpusherkey
    export PUSHER_SECRET=yourpushersecret
    EOF
    
    $ source devenv.sh

Run !

    $ python app.py

=======
Credits
=======

Company
=======

`Makina Corpus <http://www.makina-corpus.com>`_
