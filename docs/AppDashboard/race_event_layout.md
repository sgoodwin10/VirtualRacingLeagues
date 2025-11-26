
file: resources/app/js/components/round/modals/RaceFormDrawer.vue

i want to update the layout of this form. and to show and hide different inputs based on the selected Race Type. The race types are Qualifiying, Sprint, Feature, Endurance and Custom.

Use @resources/app/js/components/round/modals/RoundFormDrawer.vue as layout and design reference.

# IMPORTANT: 
The only required fields should be Race Number and race typ (as well as the relationship ids). The database and backend should also validate this as well. Everything else is optional

## Fields to hide from the UI
Race number:
Remove from UI. When creating new, this should automatically increment to the next race number on save. Editing should retain the same number.

## Layout
the layout will be 2 columns. 66% and 33%

### left side:
the fields `Race Type` and `Race Name` will be on the same row. it will be a 33% / 66% split

Field `Race Type`, depending on the selection, will hide and show various fields below. Is a required field.

### right side:
will be empty


## Race Type Hide Show groupings
each group will have the 66% / 33% split as above.
All fields should be hidden, except the ones for outlined in each group below.
Each group should be accordion style, as all the fields should be optional.

### Qualifying Group
on the left 
The existing qualifying configuration section should put all 3 options on the same row. None of the fields are required.

#### #### on the right
show the `pole position` bonus

### Sprint, Feature, Endurance and Custom Group
#### on the left
start grid is first.
both fields on the same line.

race length is next.
both fields on the same line.


hide the plaform settings



#### on the right
Penalties and Rules
remove the collision penalities and minimum pit time
Division support

##### horizontal rule

#### on the left
Points system

#### on the right
Bonus points (hide the pole position bonus)

DNF/DNS points


##### horizontal rule
#### on the left
Race notes