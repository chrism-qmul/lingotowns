import onnx
import onnxruntime
import torch
import data
import numpy

from model import RNN, categoryTensor, inputTensor, targetTensor
from data import all_letters, n_letters, category_lines, all_categories, n_categories


onnx_model = onnx.load("model.onnx")
onnx.checker.check_model(onnx_model)

ort_session = onnxruntime.InferenceSession("model.onnx")

def to_numpy(tensor):
    return tensor.detach().cpu().numpy() if tensor.requires_grad else tensor.cpu().numpy()

print([i.name for i in ort_session.get_inputs()])
## compute ONNX Runtime output prediction
#ort_inputs = {ort_session.get_inputs()[0].name: to_numpy(x)}

ort_inputs = {'category': to_numpy(categoryTensor("English")),
        'input': to_numpy(inputTensor("C")[0]),
        'hidden': to_numpy(torch.zeros(1, 128))}
output, hidden = ort_session.run(None, ort_inputs)
print("max", numpy.argmax(output))
print("output", output)
print("hidden", hidden)
#print(ort_outs)

max_length = 20
hidden = to_numpy(torch.zeros(1, 128))
last_letter = "F"
output_name = last_letter
input = inputTensor(last_letter)
for i in range(max_length):
    ort_inputs = {'category': to_numpy(categoryTensor("Chinese")),
            'input': to_numpy(input[0]),
            'hidden': hidden}
    output, hidden = ort_session.run(None, ort_inputs)
    topi = numpy.argmax(output)

    #output, hidden = rnn(category_tensor, input[0], hidden)
    #topv, topi = output.topk(1)
    #topi = topi[0][0]
    if topi == n_letters - 1:
        break
    else:
        letter = all_letters[topi]
        output_name += letter
    input = inputTensor(letter)

print(output_name)
##print(ort_inputs)
