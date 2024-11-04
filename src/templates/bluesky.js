const bluesky = `#
# The 'Blue Sky' template is basically nothing. Just a reminder that data coming
# into the node is stored in the 'node_input' variable and data going out of the
# node is stored in the 'output' variable. Both are dictionaries.
#

counter = node_input.get('counter', 0)
counter += 1
output = {'counter': counter}
`;

export default bluesky;
