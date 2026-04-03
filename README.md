# RestaurantOS - Full Stack MERN Restaurant Management System

A production-ready restaurant management system built with MongoDB, Express.js, React.js, Node.js, Socket.IO, JWT, and TailwindCSS.

---
 


## Complete Order Workflow

```
1. Waiter opens Table Dashboard
2. Selects an available table
3. Browses menu by category
4. Adds items to cart with quantities
5. Optionally adds notes (allergies, etc.)
6. Sends order to kitchen
7. Table status → "occupied"
8. Kitchen receives order in real-time via Socket.IO
9. Kitchen taps "Start" on each item → status: "preparing"
10. Kitchen taps "Ready" on each item → status: "ready"
11. When all items ready → Waiter gets notification
12. Waiter taps "Mark as Served"
13. Table status → "available" again
14. Admin sees updated analytics
```

