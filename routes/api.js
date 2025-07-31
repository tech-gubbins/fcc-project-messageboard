'use strict';

// In-memory data storage
let threads = {}; // Structure: { boardName: [thread1, thread2, ...] }
let threadIdCounter = 1;
let replyIdCounter = 1;

// Helper function to generate thread ID
function generateThreadId() {
  return threadIdCounter++;
}

// Helper function to generate reply ID
function generateReplyId() {
  return replyIdCounter++;
}

// Helper function to get current timestamp
function getCurrentTimestamp() {
  return new Date();
}

module.exports = function (app) {
  
  app.route('/api/threads/:board')
    .post(function(req, res) {
      const board = req.params.board;
      const { text, delete_password } = req.body;
      
      if (!text || !delete_password) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      if (!threads[board]) {
        threads[board] = [];
      }
      
      const newThread = {
        _id: generateThreadId(),
        text: text,
        created_on: getCurrentTimestamp(),
        bumped_on: getCurrentTimestamp(),
        reported: false,
        delete_password: delete_password,
        replies: []
      };
      
      threads[board].unshift(newThread);
      res.redirect(`/b/${board}/`);
    })
    .get(function(req, res) {
      const board = req.params.board;
      
      if (!threads[board]) {
        return res.json([]);
      }
      
      // Return most recent 10 threads with most recent 3 replies each
      const boardThreads = threads[board]
        .slice(0, 10)
        .map(thread => ({
          _id: thread._id,
          text: thread.text,
          created_on: thread.created_on,
          bumped_on: thread.bumped_on,
          replies: thread.replies
            .slice(-3)
            .map(reply => ({
              _id: reply._id,
              text: reply.text,
              created_on: reply.created_on
            })),
          replycount: thread.replies.length
        }));
      
      res.json(boardThreads);
    })
    .delete(function(req, res) {
      const board = req.params.board;
      const { thread_id, delete_password } = req.body;
      
      if (!threads[board]) {
        return res.send('incorrect password');
      }
      
      const threadIndex = threads[board].findIndex(t => t._id == thread_id);
      
      if (threadIndex === -1) {
        return res.send('incorrect password');
      }
      
      const thread = threads[board][threadIndex];
      
      if (thread.delete_password !== delete_password) {
        return res.send('incorrect password');
      }
      
      threads[board].splice(threadIndex, 1);
      res.send('success');
    })
    .put(function(req, res) {
      const board = req.params.board;
      const { thread_id } = req.body;
      
      if (!threads[board]) {
        return res.send('thread not found');
      }
      
      const thread = threads[board].find(t => t._id == thread_id);
      
      if (!thread) {
        return res.send('thread not found');
      }
      
      thread.reported = true;
      res.send('reported');
    });
    
  app.route('/api/replies/:board')
    .post(function(req, res) {
      const board = req.params.board;
      const { thread_id, text, delete_password } = req.body;
      
      if (!text || !delete_password || !thread_id) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      if (!threads[board]) {
        return res.status(404).json({ error: 'Thread not found' });
      }
      
      const thread = threads[board].find(t => t._id == thread_id);
      
      if (!thread) {
        return res.status(404).json({ error: 'Thread not found' });
      }
      
      const newReply = {
        _id: generateReplyId(),
        text: text,
        created_on: getCurrentTimestamp(),
        delete_password: delete_password,
        reported: false
      };
      
      thread.replies.push(newReply);
      thread.bumped_on = getCurrentTimestamp();
      
      // Re-sort threads by bumped_on
      threads[board].sort((a, b) => b.bumped_on - a.bumped_on);
      
      res.redirect(`/b/${board}/${thread_id}`);
    })
    .get(function(req, res) {
      const board = req.params.board;
      const { thread_id } = req.query;
      
      if (!threads[board]) {
        return res.status(404).json({ error: 'Thread not found' });
      }
      
      const thread = threads[board].find(t => t._id == thread_id);
      
      if (!thread) {
        return res.status(404).json({ error: 'Thread not found' });
      }
      
      const responseThread = {
        _id: thread._id,
        text: thread.text,
        created_on: thread.created_on,
        bumped_on: thread.bumped_on,
        replies: thread.replies.map(reply => ({
          _id: reply._id,
          text: reply.text,
          created_on: reply.created_on
        }))
      };
      
      res.json(responseThread);
    })
    .delete(function(req, res) {
      const board = req.params.board;
      const { thread_id, reply_id, delete_password } = req.body;
      
      if (!threads[board]) {
        return res.send('incorrect password');
      }
      
      const thread = threads[board].find(t => t._id == thread_id);
      
      if (!thread) {
        return res.send('incorrect password');
      }
      
      const replyIndex = thread.replies.findIndex(r => r._id == reply_id);
      
      if (replyIndex === -1) {
        return res.send('incorrect password');
      }
      
      const reply = thread.replies[replyIndex];
      
      if (reply.delete_password !== delete_password) {
        return res.send('incorrect password');
      }
      
      reply.text = '[deleted]';
      res.send('success');
    })
    .put(function(req, res) {
      const board = req.params.board;
      const { thread_id, reply_id } = req.body;
      
      if (!threads[board]) {
        return res.send('reply not found');
      }
      
      const thread = threads[board].find(t => t._id == thread_id);
      
      if (!thread) {
        return res.send('reply not found');
      }
      
      const reply = thread.replies.find(r => r._id == reply_id);
      
      if (!reply) {
        return res.send('reply not found');
      }
      
      reply.reported = true;
      res.send('reported');
    });

};
