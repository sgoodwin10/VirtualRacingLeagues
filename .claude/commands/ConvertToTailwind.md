Read $ARGUMENTS. 
- You will be converting custom csss to tailwind css classes as much as possible
- Look at this file or directory of components and its subdirectories. if any component uses custom css styles in the component, i want you to convert them to use tailwind css classes.
- All components should use the common theme. do not create new colours/styles unless absoutely necessary.
- Some custom css functions are not possible with Tailwind CSS, so custom css styles are allowed in this case.
- Delete any old and unused custom css classes.
- use which ever of the following agents - @dev-fe-app, @dev-fe-public, @dev-fe-admin - to update.
- What ever agent is being used, make sure they look in their respective `resouces/<domain>/css` folder for the app.css file.