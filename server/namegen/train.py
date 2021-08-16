# -*- coding: utf-8 -*-
from __future__ import unicode_literals, print_function, division
from namegen.model import RNN, categoryTensor, inputTensor, targetTensor
import torch
import torch.nn as nn
from namegen.data import all_letters, n_letters, category_lines, all_categories, n_categories

######################################################################
# Training
# =========
# Preparing for Training
# ----------------------
#
# First of all, helper functions to get random pairs of (category, line):
#

import random

# Random item from a list
def randomChoice(l):
    return l[random.randint(0, len(l) - 1)]

# Get a random category and random line from that category
def randomTrainingPair():
    category = randomChoice(all_categories)
    line = randomChoice(category_lines[category])
    return category, line



######################################################################
# For convenience during training we'll make a ``randomTrainingExample``
# function that fetches a random (category, line) pair and turns them into
# the required (category, input, target) tensors.
#

# Make category, input, and target tensors from a random category, line pair
def randomTrainingExample():
    category, line = randomTrainingPair()
    category_tensor = categoryTensor(category)
    input_line_tensor = inputTensor(line)
    target_line_tensor = targetTensor(line)
    return category_tensor, input_line_tensor, target_line_tensor


######################################################################
# Training the Network
# --------------------
#
# In contrast to classification, where only the last output is used, we
# are making a prediction at every step, so we are calculating loss at
# every step.
#
# The magic of autograd allows you to simply sum these losses at each step
# and call backward at the end.
#

criterion = nn.NLLLoss()

learning_rate = 0.0005

def train(category_tensor, input_line_tensor, target_line_tensor):
    target_line_tensor.unsqueeze_(-1)
    hidden = rnn.initHidden()

    rnn.zero_grad()

    loss = 0

    for i in range(input_line_tensor.size(0)):
        output, hidden = rnn(category_tensor, input_line_tensor[i], hidden)
        l = criterion(output, target_line_tensor[i])
        loss += l

    loss.backward()

    for p in rnn.parameters():
        p.data.add_(p.grad.data, alpha=-learning_rate)

    return output, loss.item() / input_line_tensor.size(0)


######################################################################
# To keep track of how long training takes I am adding a
# ``timeSince(timestamp)`` function which returns a human readable string:
#

import time
import math

def timeSince(since):
    now = time.time()
    s = now - since
    m = math.floor(s / 60)
    s -= m * 60
    return '%dm %ds' % (m, s)


######################################################################
# Training is business as usual - call train a bunch of times and wait a
# few minutes, printing the current time and loss every ``print_every``
# examples, and keeping store of an average loss per ``plot_every`` examples
# in ``all_losses`` for plotting later.
#

rnn = RNN(n_categories, n_letters, 128, n_letters)

n_iters = 100000
print_every = 5000
plot_every = 500
all_losses = []
total_loss = 0 # Reset every plot_every iters

start = time.time()

for iter in range(1, n_iters + 1):
    output, loss = train(*randomTrainingExample())
    total_loss += loss

    if iter % print_every == 0:
        print('%s (%d %d%%) %.4f' % (timeSince(start), iter, iter / n_iters * 100, loss))

    if iter % plot_every == 0:
        all_losses.append(total_loss / plot_every)
        total_loss = 0

torch.save(rnn, "namegen/model.pt")

######################################################################
# Plotting the Losses
# -------------------
#
# Plotting the historical loss from all\_losses shows the network
# learning:
#

import matplotlib.pyplot as plt

plt.figure()
plt.plot(all_losses)

