import onnx
import torch
import data
import model
import json

#model.categoryTensor

#rnn = model.RNN(data.n_categories, data.n_letters, 128, data.n_letters)
# trying something else above
#rnn.state_dict = torch.load("model.pt").state_dict
#print(torch.load("model.pt").state_dict)
#rnn.load_state_dict(torch.load("model.pt"))
rnn = model.RNN(data.n_categories, data.n_letters, 128, data.n_letters, True)
rnn.state_dict = torch.load("model.pt").state_dict
rnn.eval()
#print(rnn)
#input_size = data.n_categories + data.n_letters+ 128
batch_size = 1
#x = torch.randn(batch_size, input_size, requires_grad=True)
categories = torch.randn(1, data.n_categories)
letters = torch.randn(1, data.n_letters)
hidden = torch.randn(1, 128)

with open("values.json","w+") as fh:
    fh.write(json.dumps({'letters':data.all_letters, 'categories':data.all_categories}))

# Input to the model
#x = torch.randn(batch_size, 1, 224, 224, requires_grad=True)
#torch_out = torch_model(x)

# Export the model
torch.onnx.export(rnn,               # model being run
                  (categories, letters, hidden),                         # model input (or a tuple for multiple inputs)
                  "model.onnx",   # where to save the model (can be a file or file-like object)
                  export_params=True,        # store the trained parameter weights inside the model file
                  opset_version=10,          # the ONNX version to export the model to
                  do_constant_folding=True,  # whether to execute constant folding for optimization
                  #verbose=True,
                  input_names = ['category','input','hidden'],   # the model's input names
                  output_names = ['output', 'hidden_out'], # the model's output names
                  #dynamic_axes={'input' : {0 : 'batch_size'},    # variable length axes
                  #              'output' : {0 : 'batch_size'}})
                  )

