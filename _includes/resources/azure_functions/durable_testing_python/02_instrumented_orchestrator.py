import azure.durable_functions as df

class Logotron:
    def __init__(self) -> None:
        self.i = -1
        self.l = []

    def new_span(self):
        self.i +=1
        self.l.append([])
    
    def log(self, e):
        self.l[self.i].append(e)

logotron = Logotron()

def orchestrator_function(context: df.DurableOrchestrationContext):
    logotron.new_span()
    logotron.log("Tokyo")
    result1 = yield context.call_activity('Hello', "Tokyo")
    logotron.log("Seattle")
    result2 = yield context.call_activity('Hello', "Seattle")
    logotron.log("London")
    result3 = yield context.call_activity('Hello', "London")
    logotron.log("Done")
    return logotron.log

main = df.Orchestrator.create(orchestrator_function)
