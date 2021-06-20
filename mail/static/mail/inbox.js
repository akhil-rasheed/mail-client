document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').onsubmit = sendEmail; 
  
  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  
}

function loadEmail(emailID) {

  //hides all other views and displays single email view
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#single-email-view').style.display = 'block';
  document.querySelector('#single-email-view').innerHTML = '';
  fetch(`emails/${emailID}`, {
    method: 'GET'
  })
    .then(response => response.json())
      .then(email => {
        const fullEmailDiv = document.createElement('div');
        fullEmailDiv.classList.add('fullEmailDiv');
        const fullViewItems = ['subject',  'sender',  'recipients', 'timestamp', 'body'];
        fullViewItems.forEach(item => {
          sectionName = item;
          divSection = document.createElement('div');
          divSection.classList.add('row', `${sectionName}-fsection`)
          divSection.innerHTML = `<p>${email[sectionName]}</p>`;
          fullEmailDiv.append(divSection);
        })
        
        //marks email as read
        fetch(`emails/${emailID}`, {
          method: 'PUT',
          body: JSON.stringify({
            read: true
          })

        })

        //adds reply button
        emailActionDiv = document.createElement('div')
        emailActionDiv.classList.add('emailActionDiv')
        replyButton = document.createElement('button');
        replyButton.innerHTML = 'Reply';
        replyButton.classList.add('btn-dark');
        replyButton.addEventListener('click', () => replyToEmail(emailID));
        emailActionDiv.append(replyButton);

        //adds archive button
        archiveButton = document.createElement('button');
        //check to dynamically change archive/unarchive button
        if(email['archived'] ==true) {
          archiveButton.innerHTML = 'Unarchive';
        }
        else {
          archiveButton.innerHTML = 'Archive';
        }        
        archiveButton.classList.add('btn-dark');
        archiveButton.addEventListener('click', () => toggleArchivedStatus(emailID));
        emailActionDiv.append(archiveButton);
        
        document.querySelector('#single-email-view').append(fullEmailDiv);
        document.querySelector('#single-email-view').append(emailActionDiv);
      })
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#single-email-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    const briefViewItems = [['sender', 3], ['subject', 3], ['timestamp', 3]];
    if(mailbox=='sent') {
      briefViewItems[0] = ['recipients', 3]
    }
    emails.forEach(email => {
      briefDisplayRow = document.createElement('div');
      if(email['read']==true) {
        briefDisplayRow.classList.add('row', 'email-read');
        briefDisplayRow.classList.remove('email-unread');
        
      }
      else {
        briefDisplayRow.classList.add('row', 'email-unread');
        briefDisplayRow.classList.remove('email-read');
      }
      briefViewItems.forEach(item => {
        sectionName = item[0]
        sectionSize = item[1]
        divSection = document.createElement('div');
        divSection.classList.add('emailSection', `${sectionName}-section`, `col-${sectionSize}`);
        divSection.innerHTML = `<p>${email[sectionName]} </p>`;
        briefDisplayRow.append(divSection);
        divSection.addEventListener('click', () => loadEmail(email["id"]));
        //divSection.onclick = loadEmail(email['id']);
      })

      if(mailbox != 'sent') {
        //marked/unmarked as read button
        readMarkSection = document.createElement('div');
        readMarkSection.classList.add('readMarkSection', 'col-2')
        readMarkSection.addEventListener('click', () => toggleReadStatus(email['id']))
        briefDisplayRow.append(readMarkSection);

        //archive/unarchive button
        markArchivedSection = document.createElement('div');
        markArchivedSection.classList.add('markArchivedSection', 'col-1')
        markArchivedSection.addEventListener('click', () => toggleArchivedStatus(email['id']))
        briefDisplayRow.append(markArchivedSection);
      }

      document.querySelector('#emails-view').append(briefDisplayRow);
    })
  })
}

function sendEmail() {
  const recipients = document.querySelector('#compose-recipients').value
  const subject = document.querySelector('#compose-subject').value
  const body = document.querySelector('#compose-body').value
  console.log(recipients);
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
    })
  })
    .then(response => response.json())
    .then(result => {
        // Print result
        console.log(result);
        load_mailbox(sent);

        if ("error" in result) {
          document.querySelector('#to-text-error-message').innerHTML = result['error']
        }
    });
}

function replyToEmail(emailID) {
  //hides all other views, showing only the content
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#single-email-view').style.display = 'none';

  fetch(`emails/${emailID}`, {
    method: 'GET'
  })
    .then(response => response.json())
      .then(email => {
        document.querySelector('#compose-recipients').value =  `${email['sender']}`;
        document.querySelector('#compose-subject').value = `Re: ${email['subject']}`;
        document.querySelector('#compose-body').value = `On ${email['timestamp']}, ${email['sender']} said \n ${email['body']}`;
      })

}

function toggleReadStatus(emailID) {
  fetch(`emails/${emailID}`, {
    method: 'GET'
  })
    .then(response => response.json())
      .then(email => {
        if(email['read']==true) {
          fetch(`emails/${emailID}`, {
            method: 'PUT',
            body: JSON.stringify({
              read: false
            })
          })
        }
        else {
          fetch(`emails/${emailID}`, {
            method: 'PUT',
            body: JSON.stringify({
              read: true
          })

          })
        }
      })
  load_mailbox(inbox);
}

function toggleArchivedStatus(emailID) {
  fetch(`emails/${emailID}`, {
    method: 'GET'
  })
    .then(response => response.json())
      .then(email => {
        if(email['archived']==true) {
          fetch(`emails/${emailID}`, {
            method: 'PUT',
            body: JSON.stringify({
              archived: false
            })
          })
          location.reload();
          load_mailbox(archived);
        }
        else {
          fetch(`emails/${emailID}`, {
            method: 'PUT',
            body: JSON.stringify({
              archived: true
          })

          })
          location.reload();
        }
      })
}