class AddStartDateToTasks < ActiveRecord::Migration[7.0]
  def change
    add_column :tasks, :start_date, :date
  end
end
