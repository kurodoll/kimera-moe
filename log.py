import datetime
import timeit

import colorama
colorama.init()


# --------------------------------------------------------------------------- #
#                                                            TIMING FUNCTIONS #
# --------------------------------------------------------------------------- #
timers = {}


# Begins timing some work. A code is necessary to specify different timers,
# since multiple things may be timed at once.
def timerStart(code):
    global timers
    timers[code] = timeit.default_timer()


# Ends a timer, and returns the time elapsed. or -1 if the timer wasn't
# defined.
def timerEnd(code):
    global timers

    if code in timers:
        start_time = timers[code]
        end_time = timeit.default_timer()
        time_elapsed = end_time - start_time

        return time_elapsed

    else:
        return -1


# --------------------------------------------------------------------------- #
#                                                           LOGGING FUNCTIONS #
# --------------------------------------------------------------------------- #
def log(caller, message, log_level="log", timer_start="", timer_end=""):
    if timer_start:
        timerStart(timer_start)

    # Define the output colours we'll use as short named variables.
    reset = f"{colorama.Style.RESET_ALL}{colorama.Fore.WHITE}"
    subdued = f"{colorama.Fore.BLACK}{colorama.Style.BRIGHT}"

    # Print a timestamp.
    now = datetime.datetime.now()
    print(f"{subdued}{now}{reset}", end=" ")

    # Print the log level.
    if log_level == "fatal error":
        print(colorama.Fore.MAGENTA, end="")
    elif log_level == "error":
        print(colorama.Fore.RED, end="")
    elif log_level == "warning":
        print(colorama.Fore.YELLOW, end="")
    elif log_level == "log":
        print(colorama.Fore.GREEN, end="")
    elif log_level == "debug":
        print(colorama.Fore.CYAN, end="")
    elif log_level == "debug(2)":
        print(subdued, end="")
    elif log_level == "debug(3)":
        print(subdued, end="")
    elif log_level == "debug (network)":
        print(colorama.Fore.BLUE, end="")

    if log_level != "debug(2)" and log_level != "debug(3)":
        print(f"{log_level.upper()}{reset}", end=" ")
    else:
        print(f"{log_level.upper()}", end=" ")

    # Print which module called the log function.
    print(f"({caller})", end=" ")

    # Print the message itself.
    print(message, end="")

    # If something being timed has ended, print how much time elapsed.
    if timer_end:
        time_elapsed = timerEnd(timer_end)

        if time_elapsed != -1:
            time_elapsed = "%.2f" % time_elapsed
            print(f" {subdued}(took {time_elapsed}s)", end="")

    # Change the text colour to something subdued, so that non-log messages
    # don't stand out. This is because anything important should come through
    # this function.
    print(subdued)
