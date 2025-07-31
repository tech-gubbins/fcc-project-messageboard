const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  
  let testBoard = 'testBoard';
  const PASSWORD = 'password';

  test('Creating a new thread: POST request to /api/threads/:board', function(done) {
    chai.request(server)
      .post(`/api/threads/${testBoard}`)
      .send({
        text: 'Test thread',
        delete_password: PASSWORD
      })
      .end(function(err, res){
        assert.equal(res.status, 200);
        done();
      });
  });

  test('Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/:board', function(done) {
    chai.request(server)
      .get(`/api/threads/${testBoard}`)
      .end(function(err, res){
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        assert.isAtMost(res.body.length, 10);
        if(res.body.length > 0) {
          assert.property(res.body[0], 'replies');
          assert.property(res.body[0], 'replycount');
        }
        done();
      });
  });

  test('Deleting a thread with the incorrect password: DELETE request to /api/threads/:board', function(done) {
    // First create a thread
    chai.request(server)
      .post(`/api/threads/${testBoard}`)
      .send({
        text: 'Thread to delete with wrong password',
        delete_password: PASSWORD
      })
      .end(function(err, res){
        // Get the thread ID
        chai.request(server)
          .get(`/api/threads/${testBoard}`)
          .end(function(err, res){
            const threadId = res.body[0]._id;
            // Try to delete with wrong password
            chai.request(server)
              .delete(`/api/threads/${testBoard}`)
              .send({
                thread_id: threadId,
                delete_password: 'wrongpassword'
              })
              .end(function(err, res){
                assert.equal(res.status, 200);
                assert.equal(res.text, 'incorrect password');
                done();
              });
          });
      });
  });

  test('Deleting a thread with the correct password: DELETE request to /api/threads/:board', function(done) {
    // First create a thread
    chai.request(server)
      .post(`/api/threads/${testBoard}`)
      .send({
        text: 'Thread to delete with correct password',
        delete_password: PASSWORD
      })
      .end(function(err, res){
        // Get the thread ID
        chai.request(server)
          .get(`/api/threads/${testBoard}`)
          .end(function(err, res){
            const threadId = res.body[0]._id;
            // Delete with correct password
            chai.request(server)
              .delete(`/api/threads/${testBoard}`)
              .send({
                thread_id: threadId,
                delete_password: PASSWORD
              })
              .end(function(err, res){
                assert.equal(res.status, 200);
                assert.equal(res.text, 'success');
                done();
              });
          });
      });
  });

  test('Reporting a thread: PUT request to /api/threads/:board', function(done) {
    // First create a thread
    chai.request(server)
      .post(`/api/threads/${testBoard}`)
      .send({
        text: 'Thread to report',
        delete_password: PASSWORD
      })
      .end(function(err, res){
        // Get the thread ID
        chai.request(server)
          .get(`/api/threads/${testBoard}`)
          .end(function(err, res){
            const threadId = res.body[0]._id;
            // Report the thread
            chai.request(server)
              .put(`/api/threads/${testBoard}`)
              .send({
                thread_id: threadId
              })
              .end(function(err, res){
                assert.equal(res.status, 200);
                assert.equal(res.text, 'reported');
                done();
              });
          });
      });
  });

  test('Creating a new reply: POST request to /api/replies/:board', function(done) {
    // First create a thread
    chai.request(server)
      .post(`/api/threads/${testBoard}`)
      .send({
        text: 'Thread for reply test',
        delete_password: PASSWORD
      })
      .end(function(err, res){
        // Get the thread ID
        chai.request(server)
          .get(`/api/threads/${testBoard}`)
          .end(function(err, res){
            const threadId = res.body[0]._id;
            // Create a reply
            chai.request(server)
              .post(`/api/replies/${testBoard}`)
              .send({
                thread_id: threadId,
                text: 'Test reply',
                delete_password: PASSWORD
              })
              .end(function(err, res){
                assert.equal(res.status, 200);
                done();
              });
          });
      });
  });

  test('Viewing a single thread with all replies: GET request to /api/replies/:board', function(done) {
    // First create a thread and reply
    chai.request(server)
      .post(`/api/threads/${testBoard}`)
      .send({
        text: 'Thread to view with replies',
        delete_password: PASSWORD
      })
      .end(function(err, res){
        chai.request(server)
          .get(`/api/threads/${testBoard}`)
          .end(function(err, res){
            const threadId = res.body[0]._id;
            chai.request(server)
              .post(`/api/replies/${testBoard}`)
              .send({
                thread_id: threadId,
                text: 'Reply to view',
                delete_password: PASSWORD
              })
              .end(function(err, res){
                // Now view the thread with all replies
                chai.request(server)
                  .get(`/api/replies/${testBoard}`)
                  .query({ thread_id: threadId })
                  .end(function(err, res){
                    assert.equal(res.status, 200);
                    assert.isObject(res.body);
                    assert.property(res.body, 'replies');
                    assert.isArray(res.body.replies);
                    done();
                  });
              });
          });
      });
  });

  test('Deleting a reply with the incorrect password: DELETE request to /api/replies/:board', function(done) {
    // Create thread and reply first
    chai.request(server)
      .post(`/api/threads/${testBoard}`)
      .send({
        text: 'Thread for reply deletion test',
        delete_password: PASSWORD
      })
      .end(function(err, res){
        chai.request(server)
          .get(`/api/threads/${testBoard}`)
          .end(function(err, res){
            const threadId = res.body[0]._id;
            chai.request(server)
              .post(`/api/replies/${testBoard}`)
              .send({
                thread_id: threadId,
                text: 'Reply to delete with wrong password',
                delete_password: PASSWORD
              })
              .end(function(err, res){
                chai.request(server)
                  .get(`/api/replies/${testBoard}`)
                  .query({ thread_id: threadId })
                  .end(function(err, res){
                    const replyId = res.body.replies[0]._id;
                    // Try to delete with wrong password
                    chai.request(server)
                      .delete(`/api/replies/${testBoard}`)
                      .send({
                        thread_id: threadId,
                        reply_id: replyId,
                        delete_password: 'wrongpassword'
                      })
                      .end(function(err, res){
                        assert.equal(res.status, 200);
                        assert.equal(res.text, 'incorrect password');
                        done();
                      });
                  });
              });
          });
      });
  });

  test('Deleting a reply with the correct password: DELETE request to /api/replies/:board', function(done) {
    // Create thread and reply first
    chai.request(server)
      .post(`/api/threads/${testBoard}`)
      .send({
        text: 'Thread for successful reply deletion',
        delete_password: PASSWORD
      })
      .end(function(err, res){
        chai.request(server)
          .get(`/api/threads/${testBoard}`)
          .end(function(err, res){
            const threadId = res.body[0]._id;
            chai.request(server)
              .post(`/api/replies/${testBoard}`)
              .send({
                thread_id: threadId,
                text: 'Reply to delete with correct password',
                delete_password: PASSWORD
              })
              .end(function(err, res){
                chai.request(server)
                  .get(`/api/replies/${testBoard}`)
                  .query({ thread_id: threadId })
                  .end(function(err, res){
                    const replyId = res.body.replies[0]._id;
                    // Delete with correct password
                    chai.request(server)
                      .delete(`/api/replies/${testBoard}`)
                      .send({
                        thread_id: threadId,
                        reply_id: replyId,
                        delete_password: PASSWORD
                      })
                      .end(function(err, res){
                        assert.equal(res.status, 200);
                        assert.equal(res.text, 'success');
                        done();
                      });
                  });
              });
          });
      });
  });

  test('Reporting a reply: PUT request to /api/replies/:board', function(done) {
    // Create thread and reply first
    chai.request(server)
      .post(`/api/threads/${testBoard}`)
      .send({
        text: 'Thread for reply reporting',
        delete_password: PASSWORD
      })
      .end(function(err, res){
        chai.request(server)
          .get(`/api/threads/${testBoard}`)
          .end(function(err, res){
            const threadId = res.body[0]._id;
            chai.request(server)
              .post(`/api/replies/${testBoard}`)
              .send({
                thread_id: threadId,
                text: 'Reply to report',
                delete_password: PASSWORD
              })
              .end(function(err, res){
                chai.request(server)
                  .get(`/api/replies/${testBoard}`)
                  .query({ thread_id: threadId })
                  .end(function(err, res){
                    const replyId = res.body.replies[0]._id;
                    // Report the reply
                    chai.request(server)
                      .put(`/api/replies/${testBoard}`)
                      .send({
                        thread_id: threadId,
                        reply_id: replyId
                      })
                      .end(function(err, res){
                        assert.equal(res.status, 200);
                        assert.equal(res.text, 'reported');
                        done();
                      });
                  });
              });
          });
      });
  });
  
});
