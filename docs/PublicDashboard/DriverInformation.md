# Overview
When a driver is dsiplayed anywhere in the `resources/public` dashboard, allow the name to be clicked on to open a modal with more information about the driver.


# Current
The driver name is displayed as text


# New Development
Whenever a driver's name is displayed, have the name clickable that will open a small modal that will show the drivers information, current competitions/seasons, total poles, total podiums, driver number and nickname as well as their platform accounts (discord, psn). Do not show their first and last name.

make is a reuable component that will load the information when the modal is shown.

Use resources/public/js/components/common/overlays/modals/VrlModal.vue for the modal.

Present all the information in a elegant logical design.


use @dev-fe-public and @dev-be